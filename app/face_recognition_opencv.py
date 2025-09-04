"""
OpenCV-based face recognition service for shared hosting compatibility.
This replaces the face_recognition library with OpenCV Haar Cascades.
"""

import cv2
import numpy as np
import os
import hashlib
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from .models import User
from .database import get_db
import base64
from io import BytesIO
from PIL import Image


class OpenCVFaceRecognition:
    def __init__(self):
        # Initialize face cascade classifier
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        self.eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')
        
    def detect_faces(self, image: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """
        Detect faces in an image using Haar Cascades.
        Returns list of (x, y, w, h) tuples for detected faces.
        """
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30),
            flags=cv2.CASCADE_SCALE_IMAGE
        )
        # Convert numpy array to list of tuples
        if len(faces) > 0:
            return [(int(x), int(y), int(w), int(h)) for (x, y, w, h) in faces]
        return []
    
    def extract_face_features(self, image: np.ndarray, face_rect: Tuple[int, int, int, int]) -> np.ndarray:
        """
        Extract face features using simple image processing.
        This is a simplified version - for production, consider using a pre-trained model.
        """
        x, y, w, h = face_rect
        face_roi = image[y:y+h, x:x+w]
        
        # Resize to standard size
        face_resized = cv2.resize(face_roi, (100, 100))
        
        # Convert to grayscale
        face_gray = cv2.cvtColor(face_resized, cv2.COLOR_BGR2GRAY)
        
        # Apply histogram equalization
        face_equalized = cv2.equalizeHist(face_gray)
        
        # Flatten to 1D array
        features = face_equalized.flatten()
        
        return features
    
    def calculate_similarity(self, features1: np.ndarray, features2: np.ndarray) -> float:
        """
        Calculate similarity between two face feature vectors.
        Returns a similarity score between 0 and 1.
        """
        # Use correlation coefficient for similarity
        correlation = np.corrcoef(features1, features2)[0, 1]
        
        # Handle NaN values
        if np.isnan(correlation):
            return 0.0
        
        # Convert correlation to similarity score (0-1)
        similarity = (correlation + 1) / 2
        return max(0.0, min(1.0, similarity))
    
    def process_image(self, image_data: bytes) -> Optional[np.ndarray]:
        """
        Process image data and return OpenCV image array.
        """
        try:
            # Convert bytes to PIL Image
            pil_image = Image.open(BytesIO(image_data))
            
            # Convert to RGB if necessary
            if pil_image.mode != 'RGB':
                pil_image = pil_image.convert('RGB')
            
            # Convert PIL to OpenCV format
            opencv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
            
            return opencv_image
        except Exception as e:
            print(f"Error processing image: {e}")
            return None
    
    def recognize_user(self, image_data: bytes, db: Session) -> Optional[User]:
        """
        Recognize a user from an image using OpenCV-based face recognition.
        """
        # Process the input image
        input_image = self.process_image(image_data)
        if input_image is None:
            return None
        
        # Detect faces in the input image
        faces = self.detect_faces(input_image)
        if not faces:
            return None
        
        # Use the largest face (assuming it's the main subject)
        main_face = max(faces, key=lambda f: f[2] * f[3])
        
        # Extract features from the main face
        input_features = self.extract_face_features(input_image, main_face)
        
        # Get all users with face data
        users = db.query(User).filter(User.face_encoding.isnot(None)).all()
        
        best_match = None
        best_similarity = 0.0
        similarity_threshold = 0.7  # Adjust this threshold as needed
        
        for user in users:
            try:
                # Decode stored face features
                stored_features = np.frombuffer(user.face_encoding, dtype=np.uint8)
                
                # Calculate similarity
                similarity = self.calculate_similarity(input_features, stored_features)
                
                if similarity > best_similarity and similarity > similarity_threshold:
                    best_similarity = similarity
                    best_match = user
                    
            except Exception as e:
                print(f"Error processing user {user.id}: {e}")
                continue
        
        return best_match
    
    def register_face(self, image_data: bytes, user_id: int, db: Session) -> bool:
        """
        Register a face for a user.
        """
        try:
            # Process the input image
            input_image = self.process_image(image_data)
            if input_image is None:
                return False
            
            # Detect faces in the input image
            faces = self.detect_faces(input_image)
            if not faces:
                return False
            
            # Use the largest face
            main_face = max(faces, key=lambda f: f[2] * f[3])
            
            # Extract features from the main face
            face_features = self.extract_face_features(input_image, main_face)
            
            # Get the user
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return False
            
            # Store the face features
            user.face_encoding = face_features.tobytes()
            db.commit()
            
            return True
            
        except Exception as e:
            print(f"Error registering face: {e}")
            return False


# Global instance
face_recognition_service = OpenCVFaceRecognition()


def recognize_user_from_image(image_data: bytes, db: Session) -> Optional[User]:
    """
    Recognize a user from image data.
    """
    return face_recognition_service.recognize_user(image_data, db)


def register_user_face(image_data: bytes, user_id: int, db: Session) -> bool:
    """
    Register a face for a user.
    """
    return face_recognition_service.register_face(image_data, user_id, db)
