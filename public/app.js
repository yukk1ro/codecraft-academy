// Connect to WebSocket server
const socket = io('http://localhost:3000');

// DOM elements
const codeEditor = document.getElementById('codeEditor');
const runButton = document.getElementById('runCode');
const output = document.getElementById('output');

// Example code template
const exampleCode = `// Write your code here
console.log("Hello, World!");`;

// Set example code
codeEditor.value = exampleCode;

// Handle code execution
runButton.addEventListener('click', () => {
    const code = codeEditor.value;
    output.textContent = 'Running...';

    socket.emit('executeCode', { code });
});

// Handle execution results
socket.on('executionResult', (result) => {
    output.textContent = result.output;
}); 