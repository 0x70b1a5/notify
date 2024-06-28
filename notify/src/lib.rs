#![feature(let_chains)]
use crate::kinode::process::notify::{
    Notification, NotificationWithProcess, Request as NotifyRequest, Response as NotifyResponse,
};
use kinode::process::notify::ProcessNotifConfig;
use kinode_process_lib::{
    await_message, call_init, get_blob, get_typed_state,
    homepage::add_to_homepage,
    http::{
        bind_http_path, bind_ws_path, send_response, send_ws_push, HttpClientAction,
        HttpServerRequest, Method, OutgoingHttpRequest, StatusCode, WsMessageType,
    },
    println, set_state, Address, LazyLoadBlob, Message, ProcessId, Request, Response,
};
use std::{any, collections::HashMap, str::FromStr};
use uuid::Uuid;
mod widget;
use widget::create_widget;
mod types;
use types::NotifState;

wit_bindgen::generate!({
    path: "target/wit",
    world: "notify-sys-v0",
    generate_unused_types: true,
    additional_derives: [serde::Deserialize, serde::Serialize],
});

fn handle_http_server_request(
    our: &Address,
    state: &mut NotifState,
    source: &Address,
    body: &[u8],
    our_channel_id: &mut u32,
) -> anyhow::Result<()> {
    println!("handle http server request");
    let Ok(server_request) = serde_json::from_slice::<HttpServerRequest>(body) else {
        println!("failed to parse request");
        return Ok(());
    };

    match server_request {
        HttpServerRequest::WebSocketOpen { channel_id, .. } => {
            println!("websocket open");
            // Set our channel_id to the newly opened channel
            // Note: this code could be improved to support multiple channels
            *our_channel_id = channel_id;

            println!("our channel id: {}", our_channel_id);

            push_notifs_to_ws(our_channel_id)?;
        }
        HttpServerRequest::WebSocketPush { channel_id, .. } => {
            println!("websocket push");

            *our_channel_id = channel_id;

            println!("our channel id: {}", our_channel_id);
            let Some(blob) = get_blob() else {
                println!("no blob");
                return Ok(());
            };

            handle_notify_request(our, state, source, &blob.bytes, our_channel_id, true)?;
        }
        HttpServerRequest::WebSocketClose(_channel_id) => {
            println!("websocket close");
            *our_channel_id = 0;
        }
        HttpServerRequest::Http(incoming) => {
            println!("http request");
            let path = incoming.bound_path(Some("notify:notify:gloria-in-excelsis-deo.os"));
            match path {
                "/add-token" => {
                    println!("add token");
                    if let Ok(Method::POST) = incoming.method()
                        && let Some(body) = get_blob()
                    {
                        let token: String = serde_json::from_slice(&body.bytes).unwrap();
                        state.push_tokens.push(token);
                        set_state(&bincode::serialize(&state)?);
                        send_response(StatusCode::CREATED, Some(HashMap::new()), vec![]);
                    } else {
                        send_response(StatusCode::BAD_REQUEST, Some(HashMap::new()), vec![]);
                    }
                }
                "/notifs" => {
                    println!("notifs");
                    let mut notifs_list: Vec<NotificationWithProcess> = vec![];
                    for (process, notifs) in state.archive.iter() {
                        for notif in notifs {
                            notifs_list.push(NotificationWithProcess {
                                process: process.clone(),
                                notification: notif.clone(),
                            });
                        }
                    }
                    send_response(
                        StatusCode::OK,
                        Some(HashMap::from([(
                            "Content-Type".to_string(),
                            "text/html".to_string(),
                        )])),
                        serde_json::to_vec(&notifs_list)?,
                    );
                }
                _ => {
                    send_response(StatusCode::NOT_FOUND, None, vec![]);
                }
            }
        }
    };

    Ok(())
}

fn empty_state() -> NotifState {
    NotifState {
        config: HashMap::new(),
        archive: HashMap::new(),
        push_tokens: vec![],
    }
}

fn push_notifs_to_ws(channel_id: &mut u32) -> anyhow::Result<()> {
    let state: NotifState = match get_typed_state(|bytes| Ok(bincode::deserialize(bytes)?)) {
        Some(s) => s,
        None => empty_state(),
    };
    println!("pushing state to ws");
    send_ws_push(
        channel_id.clone(),
        WsMessageType::Text,
        LazyLoadBlob {
            mime: Some("application/json".to_string()),
            bytes: serde_json::json!({
                "kind": "state",
                "data": &state,
            })
            .to_string()
            .as_bytes()
            .to_vec(),
        },
    );
    Ok(())
}

fn push_settings_updated_to_ws(
    channel_id: &mut u32,
    settings: &HashMap<String, ProcessNotifConfig>,
) -> anyhow::Result<()> {
    send_ws_push(
        channel_id.clone(),
        WsMessageType::Text,
        LazyLoadBlob {
            mime: Some("application/json".to_string()),
            bytes: serde_json::json!({
                "kind": "settings-updated",
                "data": &settings,
            })
            .to_string()
            .as_bytes()
            .to_vec(),
        },
    );
    Ok(())
}

fn push_error_message_to_ws(channel_id: &mut u32, message: String) -> anyhow::Result<()> {
    send_ws_push(
        channel_id.clone(),
        WsMessageType::Text,
        LazyLoadBlob {
            mime: Some("application/json".to_string()),
            bytes: serde_json::json!({
                "kind": "error",
                "data": message
            })
            .to_string()
            .as_bytes()
            .to_vec(),
        },
    );
    Ok(())
}

fn handle_notify_request(
    our: &Address,
    state: &mut NotifState,
    source: &Address,
    body: &[u8],
    channel_id: &mut u32,
    is_http: bool,
) -> anyhow::Result<()> {
    println!("handle notify request");
    println!("request: {:?}", serde_json::from_slice::<String>(body));
    match serde_json::from_slice::<NotifyRequest>(body)? {
        NotifyRequest::Push(mut notif) => {
            println!("push");
            if source.node == our.node {
                println!("push request: {}", source.process.clone().to_string());

                // ignore the notification if process is not allowed
                if let Some(config) = state.config.get(&source.process.to_string()) {
                    if !config.allow {
                        push_error_message_to_ws(
                            channel_id,
                            format!(
                                "Process {} is not allowed to send notifications.",
                                source.process.to_string()
                            ),
                        )?;
                        return Ok(());
                    }

                    // if notif.id is not None, reject the Push
                    // we alone can set ids
                    if notif.id.is_some() {
                        push_error_message_to_ws(
                            channel_id,
                            "Pushed notification IDs must not be set.".to_string(),
                        )?;
                        return Ok(());
                    }

                    // set notif.id
                    notif.id = Some(Uuid::new_v4().to_string());

                    state
                        .archive
                        .entry(source.process.clone().to_string())
                        .and_modify(|e| e.push(notif.clone()))
                        .or_insert(vec![notif.clone()]);

                    set_state(&bincode::serialize(&state)?);

                    // TODO: send notification
                } else {
                    push_error_message_to_ws(
                        channel_id,
                        format!("Process {} is not configured.", source.process.to_string()),
                    )?;
                    return Ok(());
                }
            } else {
                push_error_message_to_ws(
                    channel_id,
                    format!(
                        "Node {} is not allowed to send notifications.",
                        source.node.to_string()
                    ),
                )?;
                return Ok(());
            }
            if is_http {
                push_notifs_to_ws(channel_id)?;
            } else {
                Response::new()
                    .body(serde_json::to_vec(&NotifyResponse::Push)?)
                    .send()?;
            }
        }
        NotifyRequest::History => {
            println!("history");
            let mut notifs_list: Vec<NotificationWithProcess> = vec![];
            for (process, notifs) in state.archive.iter() {
                for notif in notifs {
                    notifs_list.push(NotificationWithProcess {
                        process: process.clone(),
                        notification: notif.clone(),
                    });
                }
            }
            Response::new()
                .body(serde_json::to_vec(&NotifyResponse::History(notifs_list))?)
                .send()?;
        }
        NotifyRequest::UpdateSettings(ref new_settings) => {
            println!("update settings: {:?}", new_settings);
            state.config.insert(
                new_settings.clone().process.to_string(),
                new_settings.clone().settings,
            );
            set_state(&bincode::serialize(&state)?);
            let new_state: NotifState =
                match get_typed_state(|bytes| Ok(bincode::deserialize(bytes)?)) {
                    Some(s) => s,
                    None => empty_state(),
                };
            push_settings_updated_to_ws(channel_id, &new_state.config)?;
        }
        NotifyRequest::Delete(id) => {
            println!("delete: {}", id);
            for (_process, notifs) in state.archive.iter_mut() {
                *notifs = notifs
                    .iter()
                    .filter(|n| n.id != Some(id.clone()))
                    .cloned()
                    .collect();
            }
            set_state(&bincode::serialize(&state)?);
            if is_http {
                push_notifs_to_ws(channel_id)?;
            } else {
                Response::new()
                    .body(serde_json::to_vec(&NotifyResponse::Delete)?)
                    .send()?;
            }
        }
        NotifyRequest::WebSocketClose(_) => {}
    }
    Ok(())
}

fn handle_response(_source: &Address, _body: &[u8], _is_http: bool) -> anyhow::Result<()> {
    Ok(())
}

fn handle_message(
    our: &Address,
    state: &mut NotifState,
    channel_id: &mut u32,
) -> anyhow::Result<()> {
    let message = await_message()?;

    let http_server_address = ProcessId::from_str("http_server:distro:sys")?;

    match message {
        Message::Response {
            ref source,
            ref body,
            ..
        } => handle_response(source, body, false),
        Message::Request {
            ref source,
            ref body,
            ..
        } => {
            if source.process.eq(&http_server_address) {
                handle_http_server_request(&our, state, source, body, channel_id)
            } else {
                handle_notify_request(our, state, source, body, channel_id, false)
            }
        }
    }
}

const ICON: &str = include_str!("ICON");

call_init!(init);
fn init(our: Address) {
    println!("begin");

    bind_http_path("/add-token", false, false).expect("failed to bind /add-token");
    bind_http_path("/notifs", true, false).expect("failed to bind /notifs");
    bind_ws_path("/", true, false).unwrap();

    let mut state: NotifState = match get_typed_state(|bytes| Ok(bincode::deserialize(bytes)?)) {
        Some(s) => s,
        None => empty_state(),
    };

    add_to_homepage("Notifications", Some(ICON), None, Some(create_widget()));
    let mut our_channel_id: u32 = 1854;

    loop {
        match handle_message(&our, &mut state, &mut our_channel_id) {
            Ok(()) => {}
            Err(e) => {
                println!("error: {:?}", e);
            }
        };
    }
}

fn send_notif_to_expo(notif: &mut Notification) -> anyhow::Result<()> {
    let outgoing_request = OutgoingHttpRequest {
        method: "POST".to_string(),
        version: None,
        url: "https://exp.host/--/api/v2/push/send".to_string(),
        headers: HashMap::from_iter(vec![(
            "Content-Type".to_string(),
            "application/json".to_string(),
        )]),
    };
    let body = serde_json::to_vec(&HttpClientAction::Http(outgoing_request))?;

    if let Some(state) = get_typed_state(|bytes| Ok(bincode::deserialize::<NotifState>(bytes)?)) {
        notif.to = state.push_tokens.clone();
    }

    Request::new()
        .target(Address::new(
            "our",
            ProcessId::new(Some("http_client"), "distro", "sys"),
        ))
        .body(body)
        .expects_response(30)
        .blob(LazyLoadBlob {
            mime: Some("application/json".to_string()),
            bytes: serde_json::to_vec(notif)?,
        })
        .send()?;

    Ok(())
}
