from huggingface_hub import InferenceClient
import os

# Set HF_TOKEN in your environment variables
HF_TOKEN = os.getenv("HF_TOKEN", "")

def generate_image(prompt, filename=None):
    if not filename:
        safe = "".join(c for c in prompt[:30] if c.isalnum() or c in " _-").strip()
        filename = safe.replace(" ", "_") + ".png"

    client = InferenceClient(provider="auto", api_key=HF_TOKEN)
    print(f"Generating: '{prompt}'...")

    image = client.text_to_image(
        prompt,
        model="black-forest-labs/FLUX.1-schnell",
    )

    image.save(filename)
    size = os.path.getsize(filename)
    print(f"✓ Saved: {filename} ({size/1024:.1f} KB)")
    return filename

if __name__ == "__main__":
    prompt = input("Enter image prompt: ").strip()
    if prompt:
        generate_image(prompt)