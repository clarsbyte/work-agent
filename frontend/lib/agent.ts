import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000',
});

export const sendMessage = async (
    message: string, 
    chatId: string, 
    userId: string,
    onProgress: (data: any) => void
) => {
    try {
        const response = await fetch('http://localhost:8000/agent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: message,
                chat_id: chatId,
                user_id: userId,
            }),
        });

        if (!response.body) {
            throw new Error('ReadableStream not supported');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const jsonStr = line.slice(6).trim();
                        if (jsonStr) {
                            const data = JSON.parse(jsonStr);
                            onProgress(data);
                            
                            // done signal
                            if (data.type === 'done') {
                                return;
                            }
                        }
                    } catch (e) {
                        console.error('Error parsing SSE data:', e, 'Line:', line);
                    }
                }
            }
        }

        if (buffer.startsWith('data: ')) {
            try {
                const jsonStr = buffer.slice(6).trim();
                if (jsonStr) {
                    const data = JSON.parse(jsonStr);
                    onProgress(data);
                }
            } catch (e) {
                console.error('Error parsing final SSE data:', e);
            }
        }
    } catch (error) {
        console.error('Streaming error:', error);
        onProgress({ type: 'error', message: 'Failed to connect to server' });
    }
};
