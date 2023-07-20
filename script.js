/*
Let's try to t the teachable machine!
*/

let classifier;
let poseModelURL = "https://teachablemachine.withgoogle.com/models/WLt0TIdVI/";

let video;
let flippedVideo;
let label = "";
let sound, sound2;

function preload() {
  classifier = ml5.poseNet(poseModelURL);
  sound = loadSound("../mendrisio-music.mp3");
}

function setup() {
  createCanvas(320, 260);
  
  video = createCapture(VIDEO);
  video.size(320, 240);
  video.hide();

  flippedVideo = ml5.flipImage(video);
  classifyVideo();
}

function draw() {
  background(0);
  // Draw the video
  image(flippedVideo, 0, 0);

 
  // Draw the label
  fill(255);
  textSize(16);
  textAlign(CENTER);
  text(label, width / 2, height - 4);
  
  textSize(50);
  if(label == 'test pose') {
      text('music stops', width / 2, height/2);
     sound.stop();
  } 
  else if(label == 'Class 2') {
    text('music plays', width / 2, height / 2);
    if (sound.isPlaying() == false) {
      sound.play();
    }
  }
   else {
    
  }

}

// Get a prediction for the current video frame
function classifyVideo() {
  flippedVideo = ml5.flipImage(video);
  classifier.classify(flippedVideo, gotResult);
}

// When we get a result
function gotResult(error, results) {
  if (error) {
    console.error(error);
    return;
  }
  label = results[0].label;
  classifyVideo();
}
