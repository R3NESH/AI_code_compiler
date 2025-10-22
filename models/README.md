# Models Directory

This directory contains GGUF model files for Ollama.

## Adding Models

1. Download GGUF models from [Hugging Face](https://huggingface.co/models?library=gguf) or other sources
2. Place `.gguf` files in this directory
3. Ollama will automatically detect and load them

## Recommended Models

For code assistance, we recommend:
- **Mistral 7B Instruct** (4GB): Good balance of performance and resource usage
- **CodeLlama 7B** (4GB): Specialized for code generation
- **Llama 3.1 8B** (5GB): General purpose with good coding capabilities

## Quick Download Commands

```bash
# Mistral 7B Instruct (recommended)
curl -L -o models/mistral-7b-instruct.Q4_0.gguf "https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF/resolve/main/mistral-7b-instruct-v0.1.Q4_0.gguf"

# CodeLlama 7B Instruct (code-focused)
curl -L -o models/codellama-7b-instruct.Q4_0.gguf "https://huggingface.co/TheBloke/CodeLlama-7B-Instruct-GGUF/resolve/main/codellama-7b-instruct.Q4_0.gguf"
```

## Model Quantization

- **Q4_0**: 4-bit quantization, good balance of size and quality
- **Q5_0**: 5-bit quantization, better quality, larger size
- **Q8_0**: 8-bit quantization, highest quality, largest size

## File Size Guidelines

- Q4_0 models: ~4-7GB
- Q5_0 models: ~5-9GB  
- Q8_0 models: ~8-15GB

Choose based on your available RAM and performance requirements.
