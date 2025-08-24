#!/usr/bin/env python3
"""
Test script for face recognition system
This script helps verify that the face recognition is working properly
"""

import face_recognition
import numpy as np
from PIL import Image
import os

def test_face_encoding():
    """Test basic face encoding functionality"""
    print("Testing face encoding functionality...")
    
    # Create a simple test image (you can replace this with actual face images)
    # For now, we'll just test the encoding process
    
    # Test with a sample image if available
    test_image_path = "test_face.jpg"
    if os.path.exists(test_image_path):
        print(f"Testing with image: {test_image_path}")
        image = face_recognition.load_image_file(test_image_path)
        face_locations = face_recognition.face_locations(image)
        print(f"Detected {len(face_locations)} face(s)")
        
        if face_locations:
            encodings = face_recognition.face_encodings(image, face_locations)
            print(f"Generated {len(encodings)} encoding(s)")
            print(f"Encoding shape: {encodings[0].shape}")
            print(f"Encoding data type: {encodings[0].dtype}")
            return encodings[0]
        else:
            print("No faces detected in test image")
    else:
        print("No test image found. Please create a test_face.jpg file for testing.")
    
    return None

def test_face_comparison(encoding1, encoding2):
    """Test face comparison functionality"""
    print("\nTesting face comparison...")
    
    # Test with face_recognition library functions
    matches = face_recognition.compare_faces([encoding1], encoding2, tolerance=0.4)
    distance = face_recognition.face_distance([encoding1], encoding2)[0]
    
    print(f"Face match: {matches[0]}")
    print(f"Face distance: {distance}")
    print(f"Tolerance: 0.4")
    
    # Test with different tolerances
    tolerances = [0.3, 0.4, 0.5, 0.6]
    for tolerance in tolerances:
        matches = face_recognition.compare_faces([encoding1], encoding2, tolerance=tolerance)
        print(f"Tolerance {tolerance}: {'Match' if matches[0] else 'No Match'}")

def main():
    print("Face Recognition Test Script")
    print("=" * 40)
    
    # Test basic encoding
    encoding = test_face_encoding()
    
    if encoding is not None:
        # Test comparison with itself (should always match)
        print("\nTesting self-comparison (should always match):")
        test_face_comparison(encoding, encoding)
        
        # Test with a slightly modified encoding (simulating different face)
        print("\nTesting with modified encoding (simulating different face):")
        modified_encoding = encoding + np.random.normal(0, 0.1, encoding.shape)
        test_face_comparison(encoding, modified_encoding)
    
    print("\nTest completed!")

if __name__ == "__main__":
    main() 