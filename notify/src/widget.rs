pub fn create_widget() -> &'static str {
    r#"<html>
  <head>
  <title>Notifications</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
      * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
      }

      body {
          font-family: sans-serif;
          border-radius: 1em;
          backdrop-filter: saturate(1.25);
          color: white;
      }

      .notifs {
          display: flex;
          flex-direction: column;
          gap: 0.5em;
          padding: 0.5em;
      }

      .notif {
          border-radius: 0.5em;
          padding: 0.5em;
          background: rgba(255, 255, 255, 0.1);
      }

      .notif:hover {
          background: rgba(255, 255, 255, 0.2);
      }

      .title {
          font-weight: bold;
      }

      .body {
          font-size: 14px;
      }
  </style>
  </head>
      <body>
          <div class="notifs"></div>
          <script>
              document.addEventListener('DOMContentLoaded', () => {
                  fetch('/notify:notify:gloria-in-excelsis-deo.os/notifs')
                  .then(response => response.json())
                  .then(data => {
                      if (!Array.isArray(data)) return;
                      if (data.length === 0) {
                          document.querySelector('.notifs').innerText = 'No notifications';
                          return;
                      }
                      console.log({ notifs: data })
                      data.forEach(notif => {
                          let notifElement = document.createElement('div');
                          notifElement.classList.add('notif');
                          const title = document.createElement('div')
                          title.classList.add('title')
                          title.innerText = notif.notification.title;
                          const body = document.createElement('div')
                          body.classList.add('body')
                          body.innerText = notif.notification.body;
                          notifElement.appendChild(title)
                          notifElement.appendChild(body)
                          document.querySelector('.notifs').appendChild(notifElement);
                      });
                  }).catch(e => {
                      console.error(e);
                  });
              });
          </script>
      </body>
  </html>"#
}
