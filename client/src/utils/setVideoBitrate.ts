export const setVideoBitrate = (sender: RTCRtpSender, maxBitrate: number) => {
    const parameters = sender.getParameters();
    if (!parameters.encodings) {
      parameters.encodings = [{}];
    }
    parameters.encodings[0].maxBitrate = maxBitrate;
    sender.setParameters(parameters);
  };