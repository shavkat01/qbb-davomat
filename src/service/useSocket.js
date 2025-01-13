import { onUnmounted, inject } from 'vue';

export function useSocket(eventName, callback) {
    // Inject the socket instance
    const socket = inject('socket');

    // Check if the socket is available
    if (!socket) {
        throw new Error('Socket instance is not provided. Ensure you have provided it in your app.');
    }

    // Add the event listener when the composable is used
    socket.on(eventName, callback);

    // Remove the listener when the component unmounts
    onUnmounted(() => {
        socket.off(eventName, callback);
    });
}
