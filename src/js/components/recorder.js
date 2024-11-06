import { toast } from "react-hot-toast";

export default class recorderClass {
  constructor() {
    if (!recorderClass.instance) {
      this.set = {
        start: document.getElementById("start"),
        stop: document.getElementById("stop"),
        pauseAndResume: document.getElementById("pauseAndResume"),
        preview: document.querySelector("#preview"),
        download: document.querySelector("#download"),
        recordingName: document.querySelector("#filename"),
        mimeChoiceWrapper: document.querySelector(".sh__choice"),
        videoWrapper: document.querySelector(".sh__video--wrp"),
        videoOpacitySheet: document.querySelector(".sh__video--sheet"),
        dropdownToggle: document.querySelector(".sh__dropdown--btn"),
        dropdownList: document.querySelector(".sh__dropdown__list"),
        dropdownDefaultOption: document.querySelector(
          ".sh__dropdown--defaultOption"
        ),
        dropdownOptions: document.querySelectorAll(".sh__dropdown__list--item"),
        dropdownChevron: document.querySelector(".sh__dropdown--icon.chevron"),
        headerText: document.querySelector(".sh__header"),
        toast: document.getElementById("toast"),
        mime: null,
        mediaRecorder: null,
        isRecording: false,
        isPause: false,
        filename: null,
        selectedOption: null,
      };
      recorderClass.instance = this;
    }
    return recorderClass.instance;
  }

  toggleDropdown() {
    this.set.dropdownToggle.classList.toggle("toggled");
    this.set.dropdownChevron.classList.toggle("toggled");
    this.set.dropdownList.classList.toggle("open");
  }

  getSelectedValue(el) {
    let selectedElement = el;
    let selectedAttrValue = selectedElement.getAttribute("data-value");
    this.set.dropdownDefaultOption.textContent = selectedElement.innerText;
    this.set.mime = selectedAttrValue;

    if (selectedAttrValue) {
      this.set.start.classList.add("visible");
      this.set.start.disabled = true;
    } else {
      this.set.start.classList.remove("visible");
    }

    return selectedAttrValue;
  }


  getRandomString(length) {
    let randomChars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += randomChars.charAt(
        Math.floor(Math.random() * randomChars.length)
      );
    }
    return result;
  }

  appendStatusNotification(actionType) {
    const notificationText =
      actionType === "start"
        ? "Started Recording"
        : actionType === "stop"
          ? "Stopped Recording"
          : actionType === "pause"
            ? "Paused Recording"
            : actionType === "resume"
              ? "Resumed Recording"
              : actionType === "download"
                ? "Video Downloaded Successfully!"
                : "";

    this.set.toast.classList.add("active");
    document.getElementById("desc").innerHTML = notificationText;
    setTimeout(() => {
      this.set.toast.classList.remove("active");
    }, 9000);
  }

  createRecorder(stream) {
    let recordedChunks = [];
    this.set.mediaRecorder = new MediaRecorder(stream);

    this.set.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    this.set.mediaRecorder.onstop = () => {
      if (this.set.isRecording) this.stopRecording();
      this.bakeVideo(recordedChunks);
      recordedChunks = [];
    };

    this.set.mediaRecorder.stream.oninactive = () => {
      this.stopRecording();
    };

    this.set.mediaRecorder.start(15);
    return this.set.mediaRecorder;
  }

  async recordScreenAndMicrophone() {
    try {
      const microphoneStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: "screen" },
        audio: false 
      });

      const combinedStream = new MediaStream([
        ...screenStream.getTracks(),
        ...microphoneStream.getTracks(),
      ]);

      screenStream.getTracks().forEach(track => {
        track.addEventListener('ended', () => {
          this.stopRecording(); 
        });
      });

      return combinedStream;
    } catch (error) {
      console.error("Error in recordScreenAndMicrophone:", error);
      if (error.name === 'NotAllowedError') {
        toast.error("Permission denied for screen recording. Please enable it in your browser settings.");
      } else {
        toast.error("An unexpected error occurred: " + (error.stack || error.message));
      }
      throw error;
    }
  }

  async recordScreen() {
    try {
      return await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: "screen" },
        audio: false,
      });
    } catch (error) {
      console.error("Error in recordScreen:", error);
      toast.error("Permission denied for screen sharing. Please enable it in your browser settings.");
      throw error;
    }
  }

  async recordScreenWithAudio() {
    try {
      return await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: "screen" },
        audio: true, 
      });
    } catch (error) {
      console.error("Error in recordScreenWithAudio:", error);
      toast.error("Permission denied for screen sharing. Please enable it in your browser settings.");
      throw error;
    }
  }

  bakeVideo(recordedChunks) {
    const blob = new Blob(recordedChunks, {
      type: "video/" + this.set.mime,
    });
    let savedName;
    if (this.set.filename == null || this.set.filename == "")
      savedName = this.getRandomString(15);
    else savedName = this.set.filename;

    this.set.download.href = URL.createObjectURL(blob);
    this.set.download.download = `${savedName}.mp4`;

    this.set.videoOpacitySheet.remove();
    this.set.preview.autoplay = true;
    this.set.preview.controls = true;
    this.set.preview.muted = false;
    this.set.preview.src = URL.createObjectURL(blob);
    URL.revokeObjectURL(blob);
  }

  async startRecording() {
    try {
      let stream;
      if (this.set.selectedOption === "screen") {
        stream = await this.recordScreen();
      } else if (this.set.selectedOption === "screen-audio") {
        stream = await this.recordScreenWithAudio();
      } else if (this.set.selectedOption === "screen-mic") {
        stream = await this.recordScreenAndMicrophone();
      } else {
        return;
      }

      const mimeType = "video/" + this.set.mime;

      this.set.filename = document.getElementById("filename").value;
      this.set.isRecording = true;
      this.set.mediaRecorder = this.createRecorder(stream, mimeType);
      this.set.preview.srcObject = stream;
      this.set.preview.captureStream =
        this.set.preview.captureStream || this.set.preview.mozCaptureStream;
      this.set.mimeChoiceWrapper.classList.add("hide");
      this.set.headerText.classList.add("is-recording");
      this.set.preview.classList.add("visible");
      this.set.pauseAndResume.classList.add("visible");
      this.set.stop.classList.add("visible");
      this.appendStatusNotification("start");
    } catch (error) {
      console.error("Error during startRecording:", error);
      if (error.name === 'NotAllowedError') {
        toast.error("Permission denied for screen recording. Please enable it in your browser settings.");
      } else {
        toast.error("An unexpected error occurred: " + (error.stack || error.message));
      }
    }
  }

  pauseRecording() {
    this.set.mediaRecorder.pause();
    this.set.isPause = true;
    this.appendStatusNotification("pause");
    this.set.pauseAndResume.classList.add("resume");
    this.set.pauseAndResume.classList.remove("pause");
  }

  resumeRecording() {
    this.set.mediaRecorder.resume();
    this.set.isPause = false;
    this.appendStatusNotification("resume");
    this.set.pauseAndResume.classList.remove("resume");
    this.set.pauseAndResume.classList.add("pause");
  }

  stopRecording() {
    this.set.mediaRecorder.stream.getTracks().forEach((track) => track.stop());

    if (this.set.mediaRecorder) {
      this.set.mediaRecorder.stream.getTracks().forEach((track) => track.stop());
    }

    const isInactive = this.set.mediaRecorder.state === "inactive";

    this.set.isRecording = false;
    if (!isInactive) this.set.mediaRecorder.stop();
    this.set.preview.srcObject = null;
    this.set.headerText.classList.remove("is-recording");
    this.set.headerText.classList.add("is-reviewing");
    this.set.stop.classList.remove("visible");
    this.set.pauseAndResume.classList.remove("visible");
    this.set.recordingName.classList.remove("visible");
    this.set.download.classList.add("visible");
    this.appendStatusNotification("stop");
  }

  init() {
    this.set.dropdownToggle.addEventListener("click", () => {
      this.toggleDropdown();
    });

    document.addEventListener("click", (e) => {
      if (this.set.dropdownToggle.classList.contains("toggled")) {
        if (!e.target.closest(".sh__dropdown--btn")) {
          this.toggleDropdown();
        }
      }
    });

    this.set.dropdownOptions.forEach((el) => {
      el.addEventListener("click", () => {
        this.set.recordingName.classList.add("visible");
        this.set.selectedOption = this.getSelectedValue(el);
        this.toggleDropdown();
      });
    });

    this.set.recordingName.addEventListener("input", () => {
      const isInputValid = this.set.recordingName.value.trim() !== "";

      this.set.start.disabled = !isInputValid;

      if (isInputValid) {
        this.set.start.classList.remove("btn--disabled");
        this.set.start.classList.add("active");
      } else {
        this.set.start.classList.add("btn--disabled");
        this.set.start.classList.remove("active"); 
      }
    });

    this.set.dropdownOptions.forEach((el) => {
      el.addEventListener("click", () => {
        this.set.recordingName.classList.add("visible");
        this.set.selectedOption = this.getSelectedValue(el);
        this.toggleDropdown();

        this.set.start.classList.add("btn--disabled");
        this.set.start.classList.add("visible");
        this.set.start.disabled = true;
      });
    });


    this.set.start.disabled = true; 

    this.set.start.addEventListener("click", () => {
      if (!this.set.start.disabled) {
        this.startRecording(); 
      }
    });

    this.set.stop.addEventListener("click", () => {
      this.stopRecording();
    });

    this.set.pauseAndResume.addEventListener("click", () => {
      if (this.set.isPause) {
        this.resumeRecording();
      } else {
        this.pauseRecording();
      }
    });

    this.set.download.addEventListener("click", () => {
      this.appendStatusNotification("download");
    });
  }
}
