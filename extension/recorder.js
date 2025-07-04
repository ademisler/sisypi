// Records user actions as structured blocks

class Recorder {
  constructor() {
    this.steps = [];
  }

  add(step) {
    this.steps.push(step);
  }

  clear() {
    this.steps = [];
  }
}

self.Recorder = Recorder;
