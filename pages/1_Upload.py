import streamlit as st
import requests
from PIL import Image
import io
import numpy as np
from image_capture import process_uploaded_image
from components.ui import inject_css, render_header

st.set_page_config(page_title="HallNav • Upload", layout="centered")
inject_css()
render_header("HallNav: Hall Recognition", "Upload an image to identify a lecture hall")

st.markdown("<div class='container'>", unsafe_allow_html=True)

# Ensure session state keys
st.session_state.setdefault("uploaded_image_bytes", None)
st.session_state.setdefault("processed_display_image", None)
st.session_state.setdefault("recognition_result", None)
st.session_state.setdefault("offline", False)

st.header("1. Camera Screen")
col_upload, col_preview = st.columns([1, 1])
with col_upload:
	uploaded_file = st.file_uploader(
		"Choose an image",
		type=["jpg", "jpeg", "png"],
		label_visibility="visible",
		help="Upload Lecture Hall Image",
	)
	if uploaded_file is not None:
		st.session_state.uploaded_image_bytes = uploaded_file.getvalue()
		try:
			processed_image = process_uploaded_image(io.BytesIO(st.session_state.uploaded_image_bytes))
			st.session_state.processed_display_image = Image.fromarray((processed_image * 255).astype(np.uint8))
		except ValueError as e:
			st.session_state.processed_display_image = None
			st.markdown(f"<div class='alert-error'>Error processing image: {e}</div>", unsafe_allow_html=True)

with col_preview:
	if st.session_state.processed_display_image is not None:
		st.image(st.session_state.processed_display_image, caption="Uploaded Image", use_container_width=True)

scan_col = st.columns([1, 1, 1])[1]
with scan_col:
	if st.button("Scan Hall", key="scan_button"):
		if st.session_state.uploaded_image_bytes is None:
			st.markdown("<div class='alert-error'>No image selected. Please upload an image.</div>", unsafe_allow_html=True)
		else:
			try:
				st.session_state.offline = False
				buf = io.BytesIO(st.session_state.uploaded_image_bytes)
				files = {"file": buf}
				with st.spinner("Recognizing..."):
					response = requests.post(
						"http://localhost:8000/api/recognize_hall/",
						files=files,
						timeout=4,
					)
				if response.status_code == 200:
					st.session_state.recognition_result = response.json()
					st.success("Recognition complete. Open the Results page.")
				else:
					st.session_state.recognition_result = None
					st.markdown("<div class='alert-error'>Recognition failed. Please try another image.</div>", unsafe_allow_html=True)
			except Exception as e:
				st.session_state.offline = True
				st.session_state.recognition_result = None
				st.markdown(f"<div class='alert-error'>Error contacting recognition service: {e}</div>", unsafe_allow_html=True)

st.markdown("</div>", unsafe_allow_html=True)
