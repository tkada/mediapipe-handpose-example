import {
  HandLandmarker,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

import Stats  from 'https://cdnjs.cloudflare.com/ajax/libs/stats.js/r17/Stats.min.js';

const init = async () =>{
  const stats = new Stats();
    document.body.appendChild(stats.dom);
  
  const video = document.getElementById("input_video");
  const canvasElement = document.getElementById("output_canvas"); 
  const canvasCtx = canvasElement.getContext("2d");

  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(function (stream) {
        video.srcObject = stream;
        video.play();
      })
      .catch(function (error) {
        console.error("Error accessing the camera: ", error);
      });
  } else {
    alert("Sorry, your browser does not support the camera API.");
  }
  
  const vision = await FilesetResolver.forVisionTasks(
    // path/to/wasm/root
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  const handLandmarker = await HandLandmarker.createFromOptions(
      vision,
      {
        baseOptions: {
          modelAssetPath: "./hand_landmarker.task", //.taskファイルを指定する
          delegate: "GPU" //CPU or GPUで処理するかを指定する
        },
        numHands: 2 //認識できる手の数
      });
  
  await handLandmarker.setOptions({ runningMode: "video" });

  let lastVideoTime = -1;
  
  
  const renderLoop = () => {
    canvasElement.width = video.videoWidth;
    canvasElement.height = video.videoHeight;
    let startTimeMs = performance.now();
    if (video.currentTime > 0 && video.currentTime !== lastVideoTime) {
      const results = handLandmarker.detectForVideo(video,startTimeMs);
      lastVideoTime = video.currentTime;
      
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
      if (results.landmarks) {
        for (const landmarks of results.landmarks) {
          drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
            color: "#00FF00",
            lineWidth: 5
          });
          drawLandmarks(canvasCtx, landmarks, { color: "#FF0000", lineWidth: 2 });
        }
      }
      canvasCtx.restore();
    }

    requestAnimationFrame(() => {
      stats.begin();
      renderLoop();
      stats.end();
    });
  }
  
  renderLoop();
  
}


init();

