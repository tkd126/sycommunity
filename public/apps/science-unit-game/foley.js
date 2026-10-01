(function(root) {
  // Procedural foley, not recorded audio: low-pass noise with a soft attack.
  function samples(kind, rate) {
    const duration = kind === 'bell' ? 3 : kind === 'tape' ? .35 : .24;
    const data = new Float32Array(Math.ceil(rate * duration));
    let low = 0;
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length;
      if (kind === 'bell') {
        const seconds=i/rate;
        const ring=Math.sin(2*Math.PI*440*seconds)*.45+Math.sin(2*Math.PI*1192*seconds)*.15+Math.sin(2*Math.PI*2388*seconds)*.06;
        data[i]=ring*Math.min(1,seconds/.015)*Math.exp(-seconds*1.8)*Math.pow(1-t,2);
        continue;
      }
      low += ((Math.random() * 2 - 1) - low) * (kind === 'paper' ? .48 : .12);
      const envelope = Math.pow(Math.sin(Math.PI*t),2);
      data[i] = low * envelope * (kind === 'tape' ? .16 : .06);
    }
    return data;
  }
  function play(context, kind, volume = 1) {
    const data = samples(kind, context.sampleRate);
    const buffer = context.createBuffer(1, data.length, context.sampleRate);
    buffer.copyToChannel(data, 0);
    const source = context.createBufferSource();
    const gain = context.createGain();
    gain.gain.value = .32 * Math.max(0, Math.min(1, volume));
    source.buffer = buffer;
    source.connect(gain).connect(context.destination);
    source.onended = () => { source.disconnect(); gain.disconnect(); };
    source.start();
  }
  const api = {samples, play};
  if (typeof module !== 'undefined') module.exports = api;
  root.Foley = api;
})(typeof window !== 'undefined' ? window : globalThis);
