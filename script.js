/*
Here we check the result we get from the posnet teachable machine.
See letters

This sketch is slightly different.
The syntax of p5 is different.
Also need to add another library in the html file.
*/

/*
Here we load the file from teachablemachine
*/

const modelURL = "https://teachablemachine.withgoogle.com/models/WLt0TIdVI/";
const checkpointURL = modelURL + "model.json";
const metadataURL = modelURL + "metadata.json";

const flip = true;

let model;
let totalClasses;
let myCanvas;

let classification = "None";
let probability = "100";
let poser;
let video;
let sound;
let sound2;

/*
preloadsound
*/
function preload() {
  sound = loadSound("mendrisio-music.mp3");
  /*sound2 = loadSound("orchestra.wav");*/
}

/*
Here we load the positions 
*/
async function load() {
  model = await tmPose.load(checkpointURL, metadataURL);
  totalClasses = model.getTotalClasses();
  console.log("Number of classes, ", totalClasses);
}

async function setup() {
  myCanvas = createCanvas(width, height);
  videoCanvas = createCanvas(width, height);
  await load();
  video = createCapture(VIDEO, videoReady);
  video.size(width, height);
  video.hide();
}

function draw() {
  background(0);
  if (video)
    image(video, 0, 0);
    fill(255, 0, 0);
  textSize(16);
  text("Result:" + classification, 10, 40);
  text("Probability:" + probability, 10, 20);
  textSize(8);

  if (probability > 0.8 && classification != "None") {
    push();
    textSize(16);
    fill(255);
    textAlign(CENTER);
    text(classification, width / 2, height - 50);
    pop();
    sound.play();
    // you can use thia part for to something
    if (classification == "test pose") {
      //play sound
      if (sound.isPlaying() == true) {
        sound.stop();
      }
    } else {
       if (sound.isPlaying() == false) {
        sound.play();
        }
      }

    //else if (classification == "Class 2") {
    //  if (sound.isPlaying() == false) {
    //    sound.play();
    // }
    //} 
  }

  if (poser) {
    for (var i = 0; i < poser.length; i++) {
      let x = poser[i].position.x;
      let y = poser[i].position.y;
      ellipse(x, y, 5, 5);
      text(poser[i].part, x + 4, y);
    }
  }
}

function videoReady() {
  console.log("Video Ready");
  predict();
}

/*
This function is to be copied and pasted.
What happens here is that we make a prediction of what the letter might be
*/
async function predict() {
  const flipHorizontal = false;
  const { pose, posenetOutput } = await model.estimatePose(
    video.elt, //webcam.canvas,
    flipHorizontal
  );
  const prediction = await model.predict(
    posenetOutput,
    flipHorizontal,
    totalClasses
  );

  const sortedPrediction = prediction.sort(
    (a, b) => -a.probability + b.probability
  );

  classification = sortedPrediction[0].className;
  probability = sortedPrediction[0].probability.toFixed(2);
  if (pose) poser = pose.keypoints; // is there a skeleton
  predict();
}