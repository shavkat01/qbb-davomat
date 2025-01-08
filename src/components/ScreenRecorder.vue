<template>
  <div class="flex items-center gap-4">
    <!-- Toggle Button -->
    <button
      @click="toggleRecording"
      class="px-4 py-2 text-white rounded hover:opacity-90"
      :class="isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'"
    >
      <i :class="isRecording ? 'pi pi-pause' : 'pi pi-play'"></i>
    </button>

    <!-- Status -->
    <span v-if="isRecording" class="text-sm text-gray-500">Recording...</span>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// State variables
const isRecording = ref(false);
const recordedChunks = ref([]);
let mediaRecorder = null;

// Toggle Recording Function
const toggleRecording = async () => {
  if (!isRecording.value) {
    // Start recording
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      alert('Screen recording is not supported in your browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.value.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks.value, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'screen-recording.webm';
        a.click();

        URL.revokeObjectURL(url);
        recordedChunks.value = [];
      };

      mediaRecorder.start();
      isRecording.value = true;
    } catch (error) {
      console.error('Error starting screen recording:', error);
    }
  } else {
    // Stop recording
    if (mediaRecorder) {
      mediaRecorder.stop();
      isRecording.value = false;
    }
  }
};
</script>

<style scoped>
/* Add any specific styles for your screen recorder buttons */
</style>
