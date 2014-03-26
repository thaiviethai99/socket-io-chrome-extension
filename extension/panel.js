// util function
var bglog = function(obj) {
  if (chrome && chrome.runtime) {
    chrome.runtime.sendMessage({type: "bglog", obj: obj});
  }
}
console.log('flag 1');

// Create a connection to the background page
var port = chrome.extension.connect({
  name: "socket.io-devtools-panel"
});

console.log('flag 2');

var sockets = {};
var visible = null;
var visibleLi = null;

// Handle response from background page
// Should add a visible element representing socket data to the devtool panel
port.onMessage.addListener(function (msg) {
  bglog(msg);
  var pane1 = document.getElementById("socketList");
  var pane2 = document.getElementById("Pane-2");

  // check for malformed message
  if (msg == undefined || msg == null) {
    return;
  }

  // check for message corresponding to other browser tabs
  if (msg.tab_id != chrome.devtools.inspectedWindow.tabId) {
    bglog('other browser tab msg');
    return;
  }

  // create new message list on a new socket id
  if (sockets[msg.socket_id] == undefined) {
    bglog("new socket");
    var socketLi = document.createElement("li")
    var a = document.createElement("a");
    a.innerText = msg.socket_id;
   
    socketLi.addEventListener("click", function(e) {
      // change messages displayed in center panel
      bglog('hello ');
      e.target.className = "active";
      visibleLi.className = "";
      var clicked = e.target.innerText;

      sockets[visible].pane2List.style.display = "none";
      sockets[clicked].pane2List.style.display = "block";
      visible = clicked;
      visibleLi = e.target;
    });

    socketLi.appendChild(a);
    pane1.appendChild(socketLi);

    var pane2List = document.createElement("ul");
    pane2List.className = "messageList";

    if (visible == null) {
      visible = msg.socket_id;
      socketLi.className = "active";
    } else {
      pane2List.style.display = "none";
    }
    pane2.appendChild(pane2List);

    //add to sockets list
    sockets[msg.socket_id] = { 
      pane2List : pane2List,
      messages : []
    };

    bglog("added to sockets");
    bglog(sockets);
  }

  var pane2List = sockets[msg.socket_id].pane2List;
  var li = document.createElement("li");
  li.className = "messageListElement";

  var direction = (msg.event == "socket_listen") ? "inbound" : "outbound";

  // socket's msg.type is displayed in its own css class: socket_msg_type
  var plaintext = '<span class="socket_msg_type">' + direction + " " +  msg.type + '</span> { ';
  var argcount = 0;
  for (var arg in msg.args) {
    plaintext += JSON.stringify(msg.args[arg]) + ', ';
    argcount++
  }
  if (argcount != 0) {
    plaintext = plaintext.substring(0, plaintext.length-2);
  }
  plaintext += ' }';

  li.innerHTML = plaintext;

  pane2List.appendChild(li);

  sockets[msg.socket_id].messages.push(msg);

});
