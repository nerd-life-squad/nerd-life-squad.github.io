const modelURL = 'https://teachablemachine.withgoogle.com/models/WS9vhUqB-/';
// the json file (model topology) has a reference to the bin file (model weights)
const checkpointURL = modelURL + "model.json";
// the metatadata json file contains the text labels of your model and additional information
const metadataURL = modelURL + "metadata.json";


const flip = true; // whether to flip the webcam

let model;
let totalClasses;
let myCanvas;

let classification = "None Yet";
let probability = "100";
let poser;
let video;
let button;

let table;
let data = [];
let randomNum = (Math.random() * (15.9 - 1.1) + 1.1).toFixed(1);

//music related varibles
let track;
let volume = 1.0; // Starting volume (0.0 to 1.0)
let fadeAmount = 0.03; // Amount to decrease the volume each frame
let pitch = 1.0;

let frameCountOffset = 0;

let message = "";

function updateMessage(datetime, temp, humidity, windspeed) {
  message = `AT ${datetime} I FELT ${temp}°C, AND A HUMIDITY OF ${humidity}%. THE WIND WAS TRAVELLING AT ${randomNum}m/s`;
}

function preload() {
   track = loadSound("mendrisio-track-two.mp3", sounLoaded);
}

// A function that loads the model from the checkpoint
async function load() {
  model = await tmPose.load(checkpointURL, metadataURL);
  totalClasses = model.getTotalClasses();
  console.log("Number of classes, ", totalClasses);
  table = loadTable('data-assets/mendrisio-weather.csv', 'csv', 'header', extractData);
  console.log(table);
 
  //extractData();
}

function sounLoaded() {
  track.play();
}

async function setup() {
  fontRegular = loadFont('Power-Grotesk/PowerGrotesk-Regular.otf');
  await load();
  myCanvas = createCanvas(windowWidth, windowHeight); 
  video = createCapture(VIDEO, videoReady);
  video.size(width, height);
  video.hide();

  button = createButton('ABOUT THIS PROJECT');
  button.position(30, windowHeight -80);
  button.mousePressed(about);
  col = color(0, 240, 255);
  button.style("text-font", fontRegular);
  button.style("background-color", col);
  button.style("border", "none");
  button.style("padding", "12px 16px");
  button.style("border-radius", "60px");
  track.setVolume(volume); // Set the initial volume
}

function extractData() {
  // Extract data from the specific columns (time, temp, humidity)
  for (let i = 0; i < table.getRowCount(); i++) {
    let datetime = table.getString(i, 'datetime');
    let temp = table.getNum(i, 'temp');
    let humidity = table.getNum(i, 'humidity');

    data.push({
      datetime: datetime,
      temp: temp,
      humidity: humidity
    });
  }
  console.log("Data:", data);
}

function about() {
  window.open('../about.html');
}

function draw() {
  background(255);
  if(video){
    image(video, 0, 0, width, height);
    filter(GRAY);
  }
  fill(0,240,255);
  textFont(fontRegular);
  textSize(60);
  text("DEW Digital Embodiment Wave", 30, 60);
  textSize(18);
  text("Result:" + classification, 30, 100);

  text("Probability:" + probability, 30, 130)
  ///ALEX insert if statement here testing classification against apppropriate part of array for this time in your video

  if (track.isPlaying()) {
    let waveform = track.getPeaks(width);
    noFill();
    beginShape();
    stroke(0, 240, 255); // Blue color for the waveform
    strokeWeight(0.6);

    for (let i = 0; i < waveform.length; i++) {
      let x = map(i, 0, waveform.length, 0, width);
      let y = map(waveform[i], -1, 1, height, 0);

      // Apply animation to the y-coordinate of the waveform
      y += sin((i + frameCountOffset) * 0.1) * 60; // You can adjust the animation speed and amplitude

      vertex(x, y);
    }

    endShape();

    // Increment frameCountOffset to animate the waveform
    frameCountOffset++;
  }
  noStroke();

  if (probability > 0.5 && classification != "None") {
     push();
     textSize(250);
     fill(255);
     textAlign(CENTER);
     text(classification, width / 2, height /2 + 50);
     pop();
     // you can use thia part for to something
     if (classification == "volume" && volume >0) {
        volume -= fadeAmount;
        track.setVolume(volume);
     } else if (volume <1) {
        volume += fadeAmount;
        track.setVolume(volume);
     }
     if (classification == "stop") {
        track.setVolume(0);
     } else if (classification == "play") {
        track.setVolume(volume);
     }
     if (classification == "pitch") {
        pitch += fadeAmount;
        track.rate(pitch);
     } else if (pitch > 1.0) {
        pitch -= fadeAmount; ;
        track.rate(pitch);
     } else {
      pitch -= fadeAmount;
    // Limit the bottom value of the pitch to 1
      pitch = max(pitch, 1.0);
      track.rate(pitch);
    }
  }

  textSize(1);
  if (poser) { //did we get a skeleton yet;
    for (var i = 0; i < poser.length; i++) {
      let x = poser[i].position.x;
      let y = poser[i].position.y;
      ellipse(x, y, 6, 6);
      text(poser[i].part, x + 4, y);
    }
  }

  fill(255);
  textAlign(LEFT);
  textFont(fontRegular);
  textSize(20);
  text(message, 300, height - 55); // Adjust the position according to your preference
}

function videoReady() {
  console.log("Video Ready");
  predict();
}


async function predict() {
  // Prediction #1: run input through posenet
  // predict can take in an image, video or canvas html element
  const flipHorizontal = false;
  const {
    pose,
    posenetOutput
  } = await model.estimatePose(
    video.elt, //webcam.canvas,
    flipHorizontal
  );
  // Prediction 2: run input through teachable machine assification model
  const prediction = await model.predict(
    posenetOutput,
    flipHorizontal,
    totalClasses
  );

  let datetime = data[frameCount % data.length].datetime;
  let temp = data[frameCount % data.length].temp;
  let humidity = data[frameCount % data.length].humidity;
  let windspeed = data[frameCount % data.length].windspeed; // Replace 'windspeed' with the actual column name from your CSV data

  // Call the updateMessage() function to update the dynamic message
  updateMessage(datetime, temp, humidity, windspeed);

  // console.log(prediction);
  
  // Sort prediction array by probability
  // So the first classname will have the highest probability
  const sortedPrediction = prediction.sort((a, b) => -a.probability + b.probability);

  //communicate these values back to draw function with global variables
  classification = sortedPrediction[0].className;
  probability = sortedPrediction[0].probability.toFixed(2);
  if (pose) poser = pose.keypoints; // is there a skeleton
  predict();
}




// /*
// Here we check the result we get from the posnet teachable machine.
// See letters

// This sketch is slightly different.
// The syntax of p5 is different.
// Also need to add another library in the html file.
// */

// /*
// Here we load the file from teachablemachine
// */

// // const modelURL = "https://teachablemachine.withgoogle.com/models/COSKN4igO/";
// const modelURL = "https://teachablemachine.withgoogle.com/models/_mqZ7_65G/";
// const checkpointURL = modelURL + "model.json";
// const metadataURL = modelURL + "metadata.json";

// const flip = true;

// let model;
// let totalClasses;
// let myCanvas;

// let classification = "None";
// let probability = "100";
// let poser;
// let video;
// let sound;
// let sound2;

// /*
// preloadsound
// */
// function preload() {
//   sound = loadSound("mendrisio-music.mp3");
//   /*sound2 = loadSound("orchestra.wav");*/
// }

// /*
// Here we load the positions 
// */
// async function load() {
//   model = await tmPose.load(checkpointURL, metadataURL);
//   totalClasses = model.getTotalClasses();
//   console.log("Number of classes, ", totalClasses);
// }

// async function setup() {
//   await load();
//   myCanvas = createCanvas(windowWidth, windowHeight);
//   video = createCapture(VIDEO, videoReady);
//   video.size(width, height);
//   video.hide();
// }

// function draw() {
//   background(0);
//   if (video)
//     image(video, 0, 0, width, height);
//     filter(GRAY);
//     fill(0, 240, 255);
//     textSize(60);
//     text("DEW - Digital Embodiment Wave", 30, 60);
//     textSize(16);
//     text("Result:" + classification, 30, 120);
//     text("Probability:" + probability, 30, 140);
//     textSize(8);

//     console.log(classification + " " + probability)
//   if (probability > 0.8 && classification != "None") {
//     push();
//     textSize(16);
//     fill(255);
//     textAlign(CENTER);
//     text(classification, width / 2, height - 50);
//     pop();
//     // you can use thia part for to something
//     if (classification == "stop") {
//       // Stop sound when test pose is detected
//       if (sound.isPlaying() == true) {
//         sound.stop();
//       }
//     } else {
//       // Play sound for all other classifications
//       if (sound.isPlaying() == false) {
//         sound.play();
//       }
//     } 
//   }

//   if (poser) {
//     for (var i = 0; i < poser.length; i++) {
//       let x = poser[i].position.x;
//       let y = poser[i].position.y;
//       ellipse(x, y, 5, 5);
//       text(poser[i].part, x + 4, y);
//     }
//   }
// }

// function videoReady() {
//   console.log("Video Ready");
//   predict();
// }

// /*
// This function is to be copied and pasted.
// What happens here is that we make a prediction of what the letter might be
// */
// async function predict() {
//   const flipHorizontal = false;
//   const { pose, posenetOutput } = await model.estimatePose(
//     video.elt, //webcam.canvas,
//     flipHorizontal
//   );
//   const prediction = await model.predict(
//     posenetOutput,
//     flipHorizontal,
//     totalClasses
//   );

//   const sortedPrediction = prediction.sort(
//     (a, b) => -a.probability + b.probability
//   );

//   classification = sortedPrediction[0].className;
//   probability = sortedPrediction[0].probability.toFixed(2);
//   if (pose) poser = pose.keypoints; // is there a skeleton
//   predict();
// }