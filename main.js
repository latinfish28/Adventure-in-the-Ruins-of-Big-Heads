"use strict";

var vertexShaderSource = `#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec4 a_position;
in vec4 a_color;

// A matrix to transform the positions by
uniform mat4 u_matrix;

// a varying to pass the color to the fragment shader
out vec4 v_color;

// all shaders have a main function
void main() {
  // Multiply the position by the matrix.
  gl_Position = u_matrix * a_position;

  // Pass the color to the fragment shader.
  v_color = a_color;
}
`;

var fragmentShaderSource = `#version 300 es

precision highp float;

// the varied color passed from the vertex shader
in vec4 v_color;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
  outColor = v_color;
}
`;


function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  var canvas = document.querySelector("#canvas");
  var gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }

  const bgm = new Audio('./music/bgm.mp3'); //背景音樂

  // Use our boilerplate utils to compile the shaders and link into a program
  var program = webglUtils.createProgramFromSources(gl,
      [vertexShaderSource, fragmentShaderSource]);

  // look up where the vertex data needs to go.
  var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  var colorAttributeLocation = gl.getAttribLocation(program, "a_color");

  // look up uniform locations
  var matrixLocation = gl.getUniformLocation(program, "u_matrix");

  function radToDeg(r) {
    return r * 180 / Math.PI;
  }

  function degToRad(d) {
    return d * Math.PI / 180;
  }

  //確定飛機與人頭的碰撞
  function intersect(sphere, box) {
    // get box closest point to sphere center by clamping
    var x = Math.max(box[0], Math.min(sphere[0], box[1]));
    var y = Math.max(box[2], Math.min(sphere[1], box[3]));
    var z = Math.max(box[4], Math.min(sphere[2], box[5]));
  
    // this is the same as isPointInsideSphere
    var distance = Math.sqrt((x - sphere[0]) * (x - sphere[0]) +
                             (y - sphere[1]) * (y - sphere[1]) +
                             (z - sphere[2]) * (z - sphere[2]));
  
    return distance < sphere[3];
  }

  function reset(){
    translation = [0, 0, -800];
    rotation = [degToRad(0), degToRad(0), degToRad(0)];
    fieldOfViewRadians = degToRad(75);
    keysPressed = {};
    speed = 80;
    randomNum = [Math.random(), Math.random(), Math.random()];
    headPosition=[];
    distance=[];
    bodyBox=[];
    wingBox=[];
    headSphere=[];

    if(randomNum[0]<0.2){
      randomNum[0]+=0.3;
    }
    if(randomNum[0]>0.6){
      randomNum[0]-=0.4;
    }  
    if(randomNum[1]<0.25){
      randomNum[1]+=0.5;
    }
    if(randomNum[2]<0.25){
      randomNum[2]+=0.3;
    }
    if(randomNum[1]>0.75){
      randomNum[1]-=0.5;
    }
    if(randomNum[2]>0.65){
      randomNum[2]-=0.5;
    }

    num = [];
    for(var i = 0; i < 50; i++){
      num[i]=Math.floor(Math.random()*50) + 1;
    }
    
    then = 0;
  }

  var translation = [0, 0, -800]; //飛機位置
  var rotation = [degToRad(0), degToRad(0), degToRad(0)]; //飛機旋轉角度
  var fieldOfViewRadians = degToRad(75);
  let keysPressed = {};
  var speed = 80;
  var randomNum = [Math.random(), Math.random(), Math.random()];
  var headPosition=[];
  var distance=[];
  var bodyBox;
  var wingBox;
  var headSphere;
  var history = []
  var start = true;
  var MoveElement = document.querySelector("#move");
  var HighestElement = document.querySelector("#highest");
  const elem = document.querySelector('#restart');
  history.push(0);

  if(randomNum[0]<0.2){
    randomNum[0]+=0.3;
  }
  if(randomNum[0]>0.6){
    randomNum[0]-=0.4;
  }
  if(randomNum[1]<0.25){
    randomNum[1]+=0.5;
  }
  if(randomNum[2]<0.25){
    randomNum[2]+=0.3;
  }
  if(randomNum[1]>0.75){
    randomNum[1]-=0.5;
  }
  if(randomNum[2]>0.65){
    randomNum[2]-=0.5;
  }
  
  var num = [];
  for(var i = 0; i < 50; i++){
    num[i]=Math.floor(Math.random()*50) + 1;
  }

  function update(deltaTime){
    translation[0] += speed * deltaTime * -Math.sin(rotation[1]);
    translation[1] += speed * deltaTime * Math.sin(rotation[0]);
    translation[2] += -1 * speed * deltaTime * Math.cos(rotation[0]);

    var angleInDegreesX = radToDeg(rotation[0]);
    if(Math.round(angleInDegreesX)!=0){
      if(Math.round(angleInDegreesX)<0){
        angleInDegreesX+=20*deltaTime;
      }
      else if(Math.round(angleInDegreesX)>0){
        angleInDegreesX-=20*deltaTime;
      }
      rotation[0] = degToRad(angleInDegreesX);
    }

    var angleInDegreesY = radToDeg(rotation[1]);
    if(Math.round(angleInDegreesY)!=0){
      if(Math.round(angleInDegreesY)<0){
        angleInDegreesY+=20*deltaTime;
      }
      else if(Math.round(angleInDegreesY)>0){
        angleInDegreesY-=20*deltaTime;
      }
      rotation[1] = degToRad(angleInDegreesY);
    }

    var angleInDegreesZ = radToDeg(rotation[2]);
    if(Math.round(angleInDegreesZ)!=0){
      if(Math.round(angleInDegreesZ)<0){
        angleInDegreesZ+=20*deltaTime;
      }
      else if(Math.round(angleInDegreesZ)>0){
        angleInDegreesZ-=20*deltaTime;
      }
      rotation[2] = degToRad(angleInDegreesZ);
    }
  }

  var then = 0;
  function render(time){
    time *= 0.001;
    var now = time;
    var deltaTime = Math.min(0.1, now - then);
    then = now;
    bgm.autoplay=true;
    bgm.play();

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // turn on depth testing
    gl.enable(gl.DEPTH_TEST);

    // tell webgl to cull faces
    gl.enable(gl.CULL_FACE);

    elem.addEventListener('click', event => {
      start = true;
    });  

    if(start){
      document.addEventListener('keydown', onKeyDown, false);
      document.addEventListener('keyup', onKeyUp, false);  
      update(deltaTime);
      elem.style.visibility = 'hidden';
    }
    drawAirplane();
    drawHead();
    drawArrow();
    MoveElement.textContent = Math.round((-translation[2]-800)/100);
    HighestElement.textContent = Math.max(...history);

    if(intersect(headSphere, bodyBox) || intersect(headSphere, wingBox)){
      history.push(Math.round((-translation[2]-800)/100));
      start = false;
      elem.style.visibility = 'visible';
      reset();
    }

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

  function onKeyDown(event)
  {
    keysPressed[event.key] = true;
    if (keysPressed['a'] || keysPressed['A'])
    {
      var angleInDegrees = radToDeg(rotation[2]);
      if(Math.round(angleInDegrees)>=-45 && Math.round(angleInDegrees)<45){
        angleInDegrees+=3;
      }
      rotation[2] = degToRad(angleInDegrees);
    }
    if (keysPressed['d'] || keysPressed['D'])
    {
      var angleInDegrees = radToDeg(rotation[2]);
      if(Math.round(angleInDegrees)>-45 && Math.round(angleInDegrees)<=45){
        angleInDegrees-=3;
      }
      rotation[2] = degToRad(angleInDegrees);
    }
    if (keysPressed['w'] || keysPressed['W'])
    {
      var angleInDegrees = radToDeg(rotation[0]);
      if(Math.round(angleInDegrees)>=-45 && Math.round(angleInDegrees)<45){
        angleInDegrees+=3;
      }
      rotation[0] = degToRad(angleInDegrees);
    }
    if (keysPressed['s'] || keysPressed['S'])
    {
      var angleInDegrees = radToDeg(rotation[0]);
      if(Math.round(angleInDegrees)>-45 && Math.round(angleInDegrees)<=45){
        angleInDegrees-=3;
      }
      rotation[0] = degToRad(angleInDegrees);
    }
    if (keysPressed['ArrowUp'])
    {
      speed+=50;
    }
    if (keysPressed['ArrowDown'])
    {
      speed-=50;
    }
    if (keysPressed['ArrowLeft'])
    {
      var angleInDegrees = radToDeg(rotation[1]);
      if(Math.round(angleInDegrees)>=-45 && Math.round(angleInDegrees)<45){
        angleInDegrees+=3;
      }
      rotation[1] = degToRad(angleInDegrees);
      translation[0]-=5;
    }
    if (keysPressed['ArrowRight'])
    {
      var angleInDegrees = radToDeg(rotation[1]);
      if(Math.round(angleInDegrees)>-45 && Math.round(angleInDegrees)<=45){
        angleInDegrees-=3;
      }
      rotation[1] = degToRad(angleInDegrees);
      translation[0]+=5;
    }
  }

  function onKeyUp(event)
  {
    delete keysPressed[event.key];
    if(event.key=='ArrowUp' || event.key=='ArrowDown'){
      speed = 80;
    }
    // if(event.key==' '){
    //   shoot = true;
    // }
  }

  // Draw the scene.
  function drawAirplane() {
    var positionBuffer = gl.createBuffer();

    // Create a vertex array object (attribute state)
    var vao = gl.createVertexArray();
  
    // and make it the one we're currently working with
    gl.bindVertexArray(vao);
  
    // Turn on the attribute
    gl.enableVertexAttribArray(positionAttributeLocation);
  
    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    var airplane = [
        //飛機頭
        0, 0, 0,
        0, 35, 40,
        30, 0, 40,

        0, 0, 0,
        -30, 0, 40,
        0, 35, 40,

        0, 0, 0, 
        30, 0, 40,
        0, -25, 40,

        0, 0, 0,
        0, -25, 40,
        -30, 0, 40,

        //機身
        0, 35, 40,
        0, 0, 120,
        30, 0, 40,

        0, 35, 40,
        -30, 0, 40,
        0, 0, 120,

        0, -25, 40,
        30, 0, 40,
        0, 0, 120,

        0, -25, 40,
        0, 0, 120,
        -30, 0, 40,

        //右翼
        0, 0, 20,
        80, 0, 80,
        0, 0, 60,

        0, 0, 20,
        0, 10, 60,
        80, 0, 80,

        0, 0, 20,
        0, 0, 60,
        -80, 0, 80,

        //左翼
        0, 0, 20,
        -80, 0, 80,
        0, 10, 60,

        0, 10, 60,
        0, 0, 60,
        80, 0, 80,

        0, 10, 60,
        -80, 0, 80,
        0, 0, 60,

        //平行右翼
        0, 0, 80,
        40, 0, 110,
        0, 0, 100,

        0, 0, 80,
        0, 5, 100,
        40, 0, 110,

        0, 5, 100,
        0, 0, 100,
        40, 0, 110,

        //平行左翼
        0, 0, 80,
        0, 0, 100,
        -40, 0, 110,

        0, 0, 80,
        -40, 0, 110,
        0, 5, 100,

        0, 5, 100,
        -40, 0, 110,
        0, 0, 100,

        //垂直機翼
        0, 0, 80,
        0, 30, 100,
        3, 0, 100,

        0, 0, 80,
        -3, 0, 100,
        0, 30, 100,

        3, 0, 100,
        0, 30, 100,
        -3, 0, 100,

    ]
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(airplane), gl.STATIC_DRAW);
      
    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 3;          // 3 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        positionAttributeLocation, size, type, normalize, stride, offset);

    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    var airplaneColor = [
          //機頭
          17, 32, 39,
          17, 32, 39,
          17, 32, 39,

          15, 45, 58,
          15, 45, 58,
          15, 45, 58,

          15, 45, 58,
          15, 45, 58,
          15, 45, 58,

          17, 32, 39,
          17, 32, 39,
          17, 32, 39,

          //機身
          17, 32, 39,
          17, 32, 39,
          17, 32, 39,

          15, 45, 58,
          15, 45, 58,
          15, 45, 58,

          15, 45, 58,
          15, 45, 58,
          15, 45, 58,

          17, 32, 39,
          17, 32, 39,
          17, 32, 39,

          //左翼
          12, 56, 77,
          12, 56, 77,
          12, 56, 77,

          10, 70, 96,
          10, 70, 96,
          10, 70, 96,

          7, 84, 115,
          7, 84, 115,
          7, 84, 115,

          //右翼
          12, 56, 77,
          12, 56, 77,
          12, 56, 77,

          10, 70, 96,
          10, 70, 96,
          10, 70, 96,

          7, 84, 115,
          7, 84, 115,
          7, 84, 115,

          //水平左翼
          12, 56, 77,
          12, 56, 77,
          12, 56, 77,

          10, 70, 96,
          10, 70, 96,
          10, 70, 96,

          7, 84, 115,
          7, 84, 115,
          7, 84, 115,

          //水平右翼
          12, 56, 77,
          12, 56, 77,
          12, 56, 77,

          10, 70, 96,
          10, 70, 96,
          10, 70, 96,

          7, 84, 115,
          7, 84, 115,
          7, 84, 115,

          //垂直機翼
          3, 104, 153,
          3, 104, 153,
          3, 104, 153,

          5, 92, 134,
          5, 92, 134,
          5, 92, 134,

          7, 84, 115,
          7, 84, 115,
          7, 84, 115,
    ]
    gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(airplaneColor), gl.STATIC_DRAW);
            
    // Turn on the attribute
    gl.enableVertexAttribArray(colorAttributeLocation);

    // Tell the attribute how to get data out of colorBuffer (ARRAY_BUFFER)
    var size = 3;          // 3 components per iteration
    var type = gl.UNSIGNED_BYTE;   // the data is 8bit unsigned bytes
    var normalize = true;  // convert from 0-255 to 0.0-1.0
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next color
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        colorAttributeLocation, size, type, normalize, stride, offset);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Bind the attribute/buffer set we want.
    gl.bindVertexArray(vao);

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    // Compute the matrix
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var zNear = 1;
    var zFar = 2000;
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

    bodyBox = [translation[0]-25, translation[0]+25, translation[1], translation[1], translation[2], translation[2]+120]
    wingBox = [translation[0]-80, translation[0]+80, translation[1], translation[1], translation[2]+40, translation[2]+60]

    // Compute the position of the first F
    var fPosition = [translation[0], translation[1], translation[2]];

    // Use matrix math to compute a position on the circle.
    // var cameraMatrix = m4.yRotation(cameraAngleRadians);
    // cameraMatrix = m4.translate(cameraMatrix, translation[0], translation[1], translation[2]+800);

    // Get the camera's postion from the matrix we computed
    var cameraPosition = [
      translation[0]+800*Math.sin(rotation[1]), translation[1]+50, translation[2]+800*Math.cos(rotation[1])
    ];

    var up = [0, 1, 0];

    // Compute the camera's matrix using look at.
    var cameraMatrix = m4.lookAt(cameraPosition, fPosition, up);

    // Make a view matrix from the camera matrix.
    var viewMatrix = m4.inverse(cameraMatrix);

    // create a viewProjection matrix. This will both apply perspective
    // AND move the world so that the camera is effectively the origin
    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    var matrix = m4.translate(viewProjectionMatrix, translation[0], translation[1], translation[2]);
    matrix = m4.xRotate(matrix, rotation[0]);
    matrix = m4.yRotate(matrix, rotation[1]);
    matrix = m4.zRotate(matrix, rotation[2]);
    // Set the matrix.
    gl.uniformMatrix4fv(matrixLocation, false, matrix);

    // Draw the geometry.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 17 * 6;
    gl.drawArrays(primitiveType, offset, count);
  }

  function drawArrow() {
    var positionBuffer = gl.createBuffer();

    // Create a vertex array object (attribute state)
    var vao = gl.createVertexArray();
  
    // and make it the one we're currently working with
    gl.bindVertexArray(vao);
  
    // Turn on the attribute
    gl.enableVertexAttribArray(positionAttributeLocation);
  
    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    var arrow = [
      0, 0, 0,
      0, 0, -30,
      10, 0, 10,

      0, 0, 0,
      -10, 0, 10,
      0, 0, -30,

      0, 8, 0,
      10, 8, 10,
      0, 0, -30,

      0, 8, 0,
      0, 0, -30,
      -10, 8, 10,

      0, 0, -30,
      10, 8, 10,
      10, 0, 10,

      0, 0, -30,
      -10, 0, 10,
      -10, 8, 10,

      0, 0, 0,
      10, 0, 10,
      10, 8, 10,
      10, 8, 10,
      0, 8, 0,
      0, 0, 0,

      0, 0, 0,
      -10, 8, 10,
      -10, 0, 10,
      -10, 8, 10,
      0, 0, 0,
      0, 8, 0,
    ]
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arrow), gl.STATIC_DRAW);
      
    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 3;          // 3 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        positionAttributeLocation, size, type, normalize, stride, offset);

    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    var arrowColor = [
          250, 240, 202,
          250, 240, 202,
          250, 240, 202,

          244, 211, 94,
          244, 211, 94,
          244, 211, 94,

          250, 240, 202,
          250, 240, 202,
          250, 240, 202,

          244, 211, 94,
          244, 211, 94,
          244, 211, 94,
          
          240, 166, 103,
          240, 166, 103,
          240, 166, 103,

          238, 150, 75,
          238, 150, 75,
          238, 150, 75,

          238, 150, 75,
          238, 150, 75,
          238, 150, 75,

          238, 150, 75,
          238, 150, 75,
          238, 150, 75,

          240, 166, 103,
          240, 166, 103,
          240, 166, 103,

          240, 166, 103,
          240, 166, 103,
          240, 166, 103,
    ]
    gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(arrowColor), gl.STATIC_DRAW);
            
    // Turn on the attribute
    gl.enableVertexAttribArray(colorAttributeLocation);

    // Tell the attribute how to get data out of colorBuffer (ARRAY_BUFFER)
    var size = 3;          // 3 components per iteration
    var type = gl.UNSIGNED_BYTE;   // the data is 8bit unsigned bytes
    var normalize = true;  // convert from 0-255 to 0.0-1.0
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next color
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        colorAttributeLocation, size, type, normalize, stride, offset);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Bind the attribute/buffer set we want.
    gl.bindVertexArray(vao);

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    // Compute the matrix
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var zNear = 1;
    var zFar = 2000;
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

    var d = Math.min(...distance);
    var n = distance.indexOf(d);
    var head = [headPosition[n][0], headPosition[n][1], headPosition[n][2]];
    headSphere = head;
    headSphere[3] = 120;
    // Use matrix math to compute a position on the circle.
    var cameraPosition = [
      translation[0], translation[1]+50, translation[2]+800
    ];
    var up = [0, 1, 0];
    var cameraMatrix = m4.lookAt(cameraPosition, translation, up);

    // Make a view matrix from the camera matrix.
    var viewMatrix = m4.inverse(cameraMatrix);

    // create a viewProjection matrix. This will both apply perspective
    // AND move the world so that the camera is effectively the origin
    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    var matrix = m4.lookAt([translation[0], translation[1]+50, translation[2]+40], head, up);
    matrix = m4.multiply(viewProjectionMatrix, matrix);

    // Set the matrix.
    gl.uniformMatrix4fv(matrixLocation, false, matrix);

    // Draw the geometry.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 17 * 6;
    gl.drawArrays(primitiveType, offset, count);
  }

  function drawHead() {
    var positionBuffer = gl.createBuffer();

    // Create a vertex array object (attribute state)
    var vao = gl.createVertexArray();
  
    // and make it the one we're currently working with
    gl.bindVertexArray(vao);
  
    // Turn on the attribute
    gl.enableVertexAttribArray(positionAttributeLocation);
  
    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    var positions = new Float32Array(HeadData.positions);
    var matrix = m4.scale(m4.yRotation(Math.PI), 6, 6, 6);
    for (var ii = 0; ii < positions.length; ii += 3) {
      var vector = m4.transformVector(matrix, [positions[ii + 0], positions[ii + 1], positions[ii + 2], 1]);
      positions[ii + 0] = vector[0];
      positions[ii + 1] = vector[1];
      positions[ii + 2] = vector[2];
    }
  
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    var numVertices =  positions.length / 3;
        
    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 3;          // 3 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        positionAttributeLocation, size, type, normalize, stride, offset);

    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    var normals = HeadData.normals;
    var colors = new Uint8Array(normals.length);
    var offset = 0;
    for (var ii = 0; ii < colors.length; ii += 3) {
      for (var jj = 0; jj < 3; ++jj) {
        colors[offset] = (normals[offset] * 0.5 + 0.5) * 255;
        ++offset;
      }
    }
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
              
    // Turn on the attribute
    gl.enableVertexAttribArray(colorAttributeLocation);

    // Tell the attribute how to get data out of colorBuffer (ARRAY_BUFFER)
    var size = 3;          // 3 components per iteration
    var type = gl.UNSIGNED_BYTE;   // the data is 8bit unsigned bytes
    var normalize = true;  // convert from 0-255 to 0.0-1.0
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next color
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        colorAttributeLocation, size, type, normalize, stride, offset);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Bind the attribute/buffer set we want.
    gl.bindVertexArray(vao);

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    // Compute the matrix
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var zNear = 1;
    var zFar = 2000;
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

    // Compute the position of the first F
    var airplanePosition = [translation[0], translation[1], translation[2]];

    var cameraPosition = [
      translation[0]+800*Math.sin(rotation[1]), translation[1]+50, translation[2]+800*Math.cos(rotation[1])
    ];
    var up = [0, 1, 0];
    var cameraMatrix = m4.lookAt(cameraPosition, translation, up);

    // Get the camera's postion from the matrix we computed

    // Make a view matrix from the camera matrix.
    var viewMatrix = m4.inverse(cameraMatrix);

    // create a viewProjection matrix. This will both apply perspective
    // AND move the world so that the camera is effectively the origin
    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    //隨機產生人頭
    var deep = 50;
    var across = 55;
    for (var zz = 0; zz < deep; ++zz) {
      var v = zz / (deep - 1);
      var z = (v - .5) * deep * 100;
      for (var xx = 0; xx < across; ++xx) {
        var a;
        if ((xx+1)*(zz+1)%2==1){
          a=1;
        }
        else{
          a=-1;
        }
        var u = (xx%10) / (across - 1);
        var x = (u - .5) * across * 100;
        headPosition[zz*across+xx] = [x*randomNum[0]*a*-1, -1000+100*randomNum[1]*num[(xx+1)*(zz+1)%50], z*randomNum[2]*(xx+1)*(zz+1)-1000];
        distance[zz*across+xx] = Math.sqrt((headPosition[zz*across+xx][0]-translation[0])*(headPosition[zz*across+xx][0]-translation[0])+
                                           (headPosition[zz*across+xx][1]-translation[1])*(headPosition[zz*across+xx][1]-translation[1])+
                                           (headPosition[zz*across+xx][2]-translation[2]+60)*(headPosition[zz*across+xx][2]-translation[2]+60))
        var matrix = m4.lookAt([x*randomNum[0]*a*-1, -1000+100*randomNum[1]*num[(xx+1)*(zz+1)%50], z*randomNum[2]*(xx+1)*(zz+1)-1000], airplanePosition, up);
        matrix = m4.scale(matrix, 2.5, 2.5, 2.5);
        matrix = m4.multiply(viewProjectionMatrix, matrix);

        // Set the matrix.
        gl.uniformMatrix4fv(matrixLocation, false, matrix);
    
        // Draw the geometry.
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        gl.drawArrays(primitiveType, offset, numVertices);
      }
    }
  }
}

var m4 = {

  perspective: function(fieldOfViewInRadians, aspect, near, far) {
    var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
    var rangeInv = 1.0 / (near - far);

    return [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (near + far) * rangeInv, -1,
      0, 0, near * far * rangeInv * 2, 0,
    ];
  },

  projection: function(width, height, depth) {
    // Note: This matrix flips the Y axis so 0 is at the top.
    return [
       2 / width, 0, 0, 0,
       0, -2 / height, 0, 0,
       0, 0, 2 / depth, 0,
      -1, 1, 0, 1,
    ];
  },

  multiply: function(a, b) {
    var a00 = a[0 * 4 + 0];
    var a01 = a[0 * 4 + 1];
    var a02 = a[0 * 4 + 2];
    var a03 = a[0 * 4 + 3];
    var a10 = a[1 * 4 + 0];
    var a11 = a[1 * 4 + 1];
    var a12 = a[1 * 4 + 2];
    var a13 = a[1 * 4 + 3];
    var a20 = a[2 * 4 + 0];
    var a21 = a[2 * 4 + 1];
    var a22 = a[2 * 4 + 2];
    var a23 = a[2 * 4 + 3];
    var a30 = a[3 * 4 + 0];
    var a31 = a[3 * 4 + 1];
    var a32 = a[3 * 4 + 2];
    var a33 = a[3 * 4 + 3];
    var b00 = b[0 * 4 + 0];
    var b01 = b[0 * 4 + 1];
    var b02 = b[0 * 4 + 2];
    var b03 = b[0 * 4 + 3];
    var b10 = b[1 * 4 + 0];
    var b11 = b[1 * 4 + 1];
    var b12 = b[1 * 4 + 2];
    var b13 = b[1 * 4 + 3];
    var b20 = b[2 * 4 + 0];
    var b21 = b[2 * 4 + 1];
    var b22 = b[2 * 4 + 2];
    var b23 = b[2 * 4 + 3];
    var b30 = b[3 * 4 + 0];
    var b31 = b[3 * 4 + 1];
    var b32 = b[3 * 4 + 2];
    var b33 = b[3 * 4 + 3];
    return [
      b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
      b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
      b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
      b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
      b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
      b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
      b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
      b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
      b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
      b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
      b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
      b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
      b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
      b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
      b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
      b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
    ];
  },

  translation: function(tx, ty, tz) {
    return [
       1,  0,  0,  0,
       0,  1,  0,  0,
       0,  0,  1,  0,
       tx, ty, tz, 1,
    ];
  },

  xRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    return [
      1, 0, 0, 0,
      0, c, s, 0,
      0, -s, c, 0,
      0, 0, 0, 1,
    ];
  },

  yRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    return [
      c, 0, -s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1,
    ];
  },

  zRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    return [
       c, s, 0, 0,
      -s, c, 0, 0,
       0, 0, 1, 0,
       0, 0, 0, 1,
    ];
  },

  scaling: function(sx, sy, sz) {
    return [
      sx, 0,  0,  0,
      0, sy,  0,  0,
      0,  0, sz,  0,
      0,  0,  0,  1,
    ];
  },

  translate: function(m, tx, ty, tz) {
    return m4.multiply(m, m4.translation(tx, ty, tz));
  },

  xRotate: function(m, angleInRadians) {
    return m4.multiply(m, m4.xRotation(angleInRadians));
  },

  yRotate: function(m, angleInRadians) {
    return m4.multiply(m, m4.yRotation(angleInRadians));
  },

  zRotate: function(m, angleInRadians) {
    return m4.multiply(m, m4.zRotation(angleInRadians));
  },

  scale: function(m, sx, sy, sz) {
    return m4.multiply(m, m4.scaling(sx, sy, sz));
  },

  inverse: function(m) {
    var m00 = m[0 * 4 + 0];
    var m01 = m[0 * 4 + 1];
    var m02 = m[0 * 4 + 2];
    var m03 = m[0 * 4 + 3];
    var m10 = m[1 * 4 + 0];
    var m11 = m[1 * 4 + 1];
    var m12 = m[1 * 4 + 2];
    var m13 = m[1 * 4 + 3];
    var m20 = m[2 * 4 + 0];
    var m21 = m[2 * 4 + 1];
    var m22 = m[2 * 4 + 2];
    var m23 = m[2 * 4 + 3];
    var m30 = m[3 * 4 + 0];
    var m31 = m[3 * 4 + 1];
    var m32 = m[3 * 4 + 2];
    var m33 = m[3 * 4 + 3];
    var tmp_0  = m22 * m33;
    var tmp_1  = m32 * m23;
    var tmp_2  = m12 * m33;
    var tmp_3  = m32 * m13;
    var tmp_4  = m12 * m23;
    var tmp_5  = m22 * m13;
    var tmp_6  = m02 * m33;
    var tmp_7  = m32 * m03;
    var tmp_8  = m02 * m23;
    var tmp_9  = m22 * m03;
    var tmp_10 = m02 * m13;
    var tmp_11 = m12 * m03;
    var tmp_12 = m20 * m31;
    var tmp_13 = m30 * m21;
    var tmp_14 = m10 * m31;
    var tmp_15 = m30 * m11;
    var tmp_16 = m10 * m21;
    var tmp_17 = m20 * m11;
    var tmp_18 = m00 * m31;
    var tmp_19 = m30 * m01;
    var tmp_20 = m00 * m21;
    var tmp_21 = m20 * m01;
    var tmp_22 = m00 * m11;
    var tmp_23 = m10 * m01;

    var t0 = (tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31) -
             (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
    var t1 = (tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31) -
             (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
    var t2 = (tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31) -
             (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
    var t3 = (tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21) -
             (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);

    var d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);

    return [
      d * t0,
      d * t1,
      d * t2,
      d * t3,
      d * ((tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30) -
           (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30)),
      d * ((tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30) -
           (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30)),
      d * ((tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30) -
           (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30)),
      d * ((tmp_4 * m00 + tmp_9 * m10 + tmp_10 * m20) -
           (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20)),
      d * ((tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33) -
           (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33)),
      d * ((tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33) -
           (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33)),
      d * ((tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33) -
           (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33)),
      d * ((tmp_17 * m03 + tmp_20 * m13 + tmp_23 * m23) -
           (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23)),
      d * ((tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12) -
           (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22)),
      d * ((tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22) -
           (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02)),
      d * ((tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02) -
           (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12)),
      d * ((tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12) -
           (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02)),
    ];
  },

  cross: function(a, b) {
    return [
       a[1] * b[2] - a[2] * b[1],
       a[2] * b[0] - a[0] * b[2],
       a[0] * b[1] - a[1] * b[0],
    ];
  },

  subtractVectors: function(a, b) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  },

  normalize: function(v) {
    var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    // make sure we don't divide by 0.
    if (length > 0.00001) {
      return [v[0] / length, v[1] / length, v[2] / length];
    } else {
      return [0, 0, 0];
    }
  },

  lookAt: function(cameraPosition, target, up) {
    var zAxis = m4.normalize(
        m4.subtractVectors(cameraPosition, target));
    var xAxis = m4.normalize(m4.cross(up, zAxis));
    var yAxis = m4.normalize(m4.cross(zAxis, xAxis));

    return [
      xAxis[0], xAxis[1], xAxis[2], 0,
      yAxis[0], yAxis[1], yAxis[2], 0,
      zAxis[0], zAxis[1], zAxis[2], 0,
      cameraPosition[0],
      cameraPosition[1],
      cameraPosition[2],
      1,
    ];
  },

  transformVector: function(m, v) {
    var dst = [];
    for (var i = 0; i < 4; ++i) {
      dst[i] = 0.0;
      for (var j = 0; j < 4; ++j) {
        dst[i] += v[j] * m[j * 4 + i];
      }
    }
    return dst;
  },

};

main();
