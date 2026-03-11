import torch
from diffusers import StableDiffusionPipeline

prompt = "futuristic cyberpunk city with neon lights"

pipe = StableDiffusionPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5"
)

pipe = pipe.to("mps")

image = pipe(prompt).images[0]

image.save("generated.png")

print("Image generated successfully")