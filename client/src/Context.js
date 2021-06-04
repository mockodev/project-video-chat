import React, { createContext, useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";
import Peer from "simple-peer";

const SocketContext = createContext();

const socket = io("http://localhost:5000");
//const socket = io("https://mockodev-webrtc.herokuapp.com");

const ContextProvider = ({ children }) => {
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [stream, setStream] = useState();
  const [name, setName] = useState("");
  const [call, setCall] = useState({});
  const [me, setMe] = useState("");
  /********************** chat **********************/
  const [chat, setChat] = useState([]);

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);

        myVideo.current.srcObject = currentStream;
      });

    socket.on("me", (id) => {setMe(id)});
    socket.on("callUser", ({ from, name: callerName, signal }) => {
      setCall({ isReceivingCall: true, from, name: callerName, signal });
    });

  }, []);

  // #1#
  const callUser = (id) => {
    const peer = new Peer({ initiator: true, trickle: false, stream });

    console.log("ready: " + id, me, name);
    peer.on("signal", (data) => {
      socket.emit("callUser", {
        userToCall: id,
        signalData: data,
        from: me,
        name,
      });
      /********************** chat **********************/
      //socket.emit("chat message", "Calling user...");
    });

    peer.on("stream", (currentStream) => {
      userVideo.current.srcObject = currentStream;
    });
    

    socket.on("callAccepted", (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
    });
  };

  const answerCall = () => {
    setCallAccepted(true);

    //console.log("stream answer call: ", stream);

    const peer = new Peer({ initiator: false, trickle: false, stream });

    peer.on("signal", (data) => {
      //console.log(`// #2.6# FRONT;  data ${data} - call.from ${call.from} - `);
      socket.emit("answerCall", { signal: data, to: call.from });

      /********************** chat **********************/
      //socket.emit("chat message", "Answering user...");
    });

    peer.on("stream", (currentStream) => {
      userVideo.current.srcObject = currentStream;
    });

    peer.signal(call.signal);
    connectionRef.current = peer;
  };

  

  const leaveCall = () => {
    setCallEnded(true);

    connectionRef.current.destroy();

    window.location.reload();
  };

  /********************** chat **********************/
  const sendMessage = (chatText) => {
    
    const msg = `${name}: ${chatText}`;
    console.log(`Message sended: ${chatText}`);
    setChat([...chat, msg])
    socket.emit("chat message", [...chat, msg]);
  };

  socket.on("chat message", (msg) => {
    setChat(msg)
    console.log(`hello ${msg}`);
  });

/*   connectionRef.current?.on("chat message peer", (msg) => {
    setChat(msg)
    console.log(`hello ${msg}`);
  }); */
  /********************** End chat **********************/

  return (
    <SocketContext.Provider
      value={{
        call,
        callAccepted,
        myVideo,
        userVideo,
        chat,
        stream,
        name,
        setName,
        callEnded,
        me,
        callUser,
        leaveCall,
        answerCall,
        sendMessage,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export { ContextProvider, SocketContext };
