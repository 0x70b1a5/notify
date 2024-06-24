use crate::kinode::process::notify::{Notification, ProcessNotifConfig};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Serialize, Deserialize)]
pub struct NotifState {
    pub config: HashMap<String, ProcessNotifConfig>,
    pub archive: HashMap<String, Vec<Notification>>,
    pub push_tokens: Vec<String>,
}

#[derive(Serialize, Deserialize)]
pub struct OkPushTicket {
    pub status: String,
    pub id: String,
}

#[derive(Serialize, Deserialize)]
pub struct PushTicketErrorDetails {
    pub error: String,
}

#[derive(Serialize, Deserialize)]
pub struct ErrPushTicket {
    pub status: String,
    pub message: String,
    pub details: PushTicketErrorDetails,
}

#[derive(Serialize, Deserialize)]
#[serde(untagged)]
pub enum PushTicket {
    Ok(OkPushTicket),
    Error(ErrPushTicket),
}

#[derive(Serialize, Deserialize)]
pub struct PushTicketResponse {
    pub data: Vec<PushTicket>,
}
