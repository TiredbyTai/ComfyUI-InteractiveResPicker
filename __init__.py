import os
import json
import struct
import folder_paths

WEB_DIRECTORY = "./web"

class InteractiveResPicker:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "width": ("INT", {"default": 512, "min": 64, "max": 4096, "step": 8}),
                "height": ("INT", {"default": 512, "min": 64, "max": 4096, "step": 8}),
                "divide_by": ("INT", {"default": 32, "min": 1, "max": 256, "step": 1}),
            }
        }

    RETURN_TYPES = ("INT", "INT", "FLOAT")
    RETURN_NAMES = ("width", "height", "aspect_ratio")
    FUNCTION = "calculate"
    CATEGORY = "TiredbyTai"

    def calculate(self, width, height, divide_by):
        div = max(1, divide_by)
        w = int(round(width / div) * div)
        h = int(round(height / div) * div)
        aspect = float(w) / float(h) if h != 0 else 1.0
        return (w, h, aspect)


NODE_CLASS_MAPPINGS = {
    "InteractiveResPicker": InteractiveResPicker,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "InteractiveResPicker": "Interactive Res Picker",
}

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
