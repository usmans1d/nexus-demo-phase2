import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff } from 'lucide-react';
import { Button } from '../ui/Button';

interface VideoCallProps {
  callerEmail: string;
  receiverEmail: string;
  onEndCall: () => void;
}

export const VideoCall: React.FC<VideoCallProps> = ({ callerEmail, receiverEmail, onEndCall }) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io('http://localhost:5000');
    
    // Join room based on caller and receiver emails (sort to ensure same room ID)
    const roomId = [callerEmail, receiverEmail].sort().join('-');
    socketRef.current.emit('join-call-room', roomId);

    const initCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        const peerConnection = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
          ]
        });

        peerConnectionRef.current = peerConnection;

        stream.getTracks().forEach(track => {
          peerConnection.addTrack(track, stream);
        });

        peerConnection.ontrack = (event) => {
          setRemoteStream(event.streams[0]);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            socketRef.current?.emit('ice-candidate', { candidate: event.candidate, roomId });
          }
        };

        socketRef.current?.on('user-joined', async () => {
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          socketRef.current?.emit('offer', { offer, roomId });
        });

        socketRef.current?.on('offer', async ({ offer }) => {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          socketRef.current?.emit('answer', { answer, roomId });
        });

        socketRef.current?.on('answer', async ({ answer }) => {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        });

        socketRef.current?.on('ice-candidate', async ({ candidate }) => {
          try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error('Error adding received ice candidate', e);
          }
        });

        socketRef.current?.emit('call-ready', roomId);

      } catch (err) {
        console.error('Error accessing media devices.', err);
      }
    };

    initCall();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      peerConnectionRef.current?.close();
      socketRef.current?.disconnect();
    };
  }, [callerEmail, receiverEmail]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const handleEndCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    peerConnectionRef.current?.close();
    socketRef.current?.disconnect();
    onEndCall();
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/95 flex flex-col items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-5xl bg-black rounded-3xl overflow-hidden aspect-video shadow-2xl flex items-center justify-center border border-gray-800">
        {/* Remote Video */}
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center text-white">
            <div className="w-20 h-20 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-xl font-medium">Waiting for other user to join...</p>
          </div>
        )}

        {/* Local Video */}
        <div className="absolute top-6 right-6 w-48 md:w-64 aspect-video bg-gray-800 rounded-xl overflow-hidden border-2 border-white/20 shadow-xl transition-all duration-300 hover:scale-105">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${isVideoOff ? 'opacity-0' : 'opacity-100'}`}
          />
          {isVideoOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <VideoOff size={32} className="text-gray-400" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-gray-900/80 backdrop-blur-xl px-8 py-4 rounded-2xl border border-white/10 shadow-2xl">
          <Button
            variant="ghost"
            className={`rounded-full p-4 transition-all ${isMuted ? 'bg-error-500/20 text-error-500 hover:bg-error-500/30' : 'bg-white/10 hover:bg-white/20 text-white'}`}
            onClick={toggleMute}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </Button>
          
          <Button
            variant="ghost"
            className={`rounded-full p-4 transition-all ${isVideoOff ? 'bg-error-500/20 text-error-500 hover:bg-error-500/30' : 'bg-white/10 hover:bg-white/20 text-white'}`}
            onClick={toggleVideo}
          >
            {isVideoOff ? <VideoOff size={24} /> : <VideoIcon size={24} />}
          </Button>
          
          <Button
            variant="ghost"
            className="rounded-full p-4 bg-error-500 hover:bg-error-600 text-white shadow-lg shadow-error-500/30 transition-all hover:scale-110 ml-4"
            onClick={handleEndCall}
          >
            <PhoneOff size={24} />
          </Button>
        </div>
      </div>
    </div>
  );
};
