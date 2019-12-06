var express = require('express');
var router = express.Router();
var synaptic = require('synaptic');
var Trainer = synaptic.Trainer,
    Architect = synaptic.Architect;

router.get('/', (req, res) => {
    var targets = [2, 4];
    var distractors = [3, 5];
    var prompts = [0, 1];
    var length = 10;
  
    var lstm = new Architect.LSTM(6, 7, 2);
    var trainer = new Trainer(lstm);
  
    trainer.DSR({
      targets: targets,
      distractors: distractors,
      prompts: prompts,
      length: length,
      rate: .17,
      iterations: 250000
    });
  
    var symbols = targets.length + distractors.length + prompts.length;
    var sequence = [],
      indexes = [],
      positions = [];
    var sequenceLength = length - prompts.length;
  
    for (i = 0; i < sequenceLength; i++) {
      var any = Math.random() * distractors.length | 0;
      sequence.push(distractors[any]);
    }
    indexes = [], positions = [];
    for (i = 0; i < prompts.length; i++) {
      indexes.push(Math.random() * targets.length | 0);
      positions.push(noRepeat(sequenceLength, positions));
    }
    positions = positions.sort();
    for (i = 0; i < prompts.length; i++) {
      sequence[positions[i]] = targets[indexes[i]];
      sequence.push(prompts[i]);
    }
  
    var check = function (which) {
      // generate input from sequence
      var input = [];
      for (let j = 0; j < symbols; j++)
        input[j] = 0;
      input[sequence[which]] = 1;
  
      // generate target output
      var output = [];
      for (let j = 0; j < targets.length; j++)
        output[j] = 0;
  
      if (which >= sequenceLength) {
        var index = which - sequenceLength;
        output[indexes[index]] = 1;
      }
  
      // check result
      var prediction = lstm.activate(input);
      return {
        prediction: prediction,
        output: output
      };
    };
  
    var value = function (array) {
      var max = .5;
      var res = -1;
      for (var i in array)
        if (array[i] > max) {
          max = array[i];
          res = i;
        }
      return res == -1 ? '-' : targets[res];
    };

    function noRepeat(range, avoid) {
      var number = Math.random() * range | 0;
      for (var i in avoid) {
        if (number == avoid[i]) {
          return noRepeat(range, avoid);
        }
      }
      return number;
    }

    function equal(prediction, output) {
      for (var i in prediction)
        if (Math.round(prediction[i]) != output[i])
          return false;
      return true;
    }
  
    for (var i = 0; i < length; i++) {
      var test = check(i);
      res.send("input: " + sequence + " output: " + test.output + " prediction: " + test.prediction );
    }
  });

module.exports = router;
