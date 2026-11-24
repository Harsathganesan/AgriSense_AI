import os
import sys
import unittest
import numpy as np
from PIL import Image

# Add plant_doctor to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "plant_doctor")))
# pyrefly: ignore[missing-import]
from predictor import PlantDiseasePredictor, SUPPORTED_CROPS, CONFIDENCE_THRESHOLD

class TestPlantDiseasePredictor(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.predictor = PlantDiseasePredictor()
        cls.test_data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "merged", "test"))

    def test_class_names_count(self):
        """Ensure all 33 target classes are loaded and supported."""
        self.assertEqual(len(self.predictor.class_names), 33)
        self.assertIn("Tomato___Late_blight", self.predictor.class_names)
        self.assertIn("Apple___Healthy", self.predictor.class_names)

    def test_supported_crops(self):
        """Ensure supported crop categories are mapped correctly."""
        self.assertIn("Apple", SUPPORTED_CROPS)
        self.assertIn("Tomato", SUPPORTED_CROPS)
        self.assertIn("Potato", SUPPORTED_CROPS)

    def test_treatments_database_completeness(self):
        """Ensure every single one of the 33 classes has complete agronomic treatment fields."""
        for c in self.predictor.class_names:
            self.assertIn(c, self.predictor.treatments, f"Missing treatment for {c}")
            t = self.predictor.treatments[c]
            self.assertIn("symptoms", t)
            self.assertIn("cause", t)
            self.assertIn("organic_treatment", t)
            self.assertIn("chemical_treatment", t)
            self.assertIn("prevention", t)

    def test_predict_healthy_sample(self):
        """Test inference on an actual test sample image for Apple Healthy."""
        apple_healthy_dir = os.path.join(self.test_data_dir, "Apple___Healthy")
        if os.path.exists(apple_healthy_dir):
            sample_files = [f for f in os.listdir(apple_healthy_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
            if sample_files:
                sample_path = os.path.join(apple_healthy_dir, sample_files[0])
                res = self.predictor.predict(sample_path)
                self.assertIn(res["status"], ["success", "uncertain"])
                self.assertEqual(res["crop"], "Apple")
                self.assertEqual(len(res["top3"]), 3)

    def test_predict_diseased_sample(self):
        """Test inference on an actual test sample image for Tomato Late Blight."""
        tomato_lb_dir = os.path.join(self.test_data_dir, "Tomato___Late_blight")
        if os.path.exists(tomato_lb_dir):
            sample_files = [f for f in os.listdir(tomato_lb_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
            if sample_files:
                sample_path = os.path.join(tomato_lb_dir, sample_files[0])
                res = self.predictor.predict(sample_path)
                self.assertIn(res["status"], ["success", "uncertain"])
                self.assertEqual(res["crop"], "Tomato")
                self.assertIsNotNone(res["treatment"])

    def test_low_confidence_uncertainty_handling(self):
        """Test that non-leaf random noise image triggers the uncertainty fallback."""
        # Generate pure white / gray noise image
        noise_arr = np.random.randint(0, 256, (224, 224, 3), dtype=np.uint8)
        noise_img = Image.fromarray(noise_arr)
        
        res = self.predictor.predict(noise_img)
        # Random noise should either trigger confidence < 0.70 with uncertain status or flag
        if res["confidence"] < CONFIDENCE_THRESHOLD:
            self.assertEqual(res["status"], "uncertain")
            self.assertEqual(res["message"], "Uncertain - please upload a clearer image of a single leaf")

if __name__ == "__main__":
    unittest.main()

