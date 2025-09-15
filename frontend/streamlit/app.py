import streamlit as st
import requests
from PIL import Image
import io
from lib.image_capture import process_uploaded_image
import numpy as np
from lib.navigation import compute_route, get_turn_by_turn, get_coordinates, HALL_LOCATIONS
import pandas as pd

# ---------- Styling ----------
st.markdown(
    """
    <style>
      .container {max-width: 800px; margin: 0 auto;}
      .title {text-align: center; color: #1E88E5; font-weight: 700;}
      .subtitle {text-align: center; color: #757575; font-style: italic;}
      .card {background: #FFFFFF; border: 2px solid #E0E0E0; padding: 16px; border-radius: 8px;}
      .alert-error {background: #EF5350; color: #FFFFFF; padding: 12px; border-radius: 6px;}
      .badge-offline {display: inline-block; padding: 4px 8px; border-radius: 12px; background: #FF9800; color: #FFFFFF; font-size: 12px;}
    </style>
    """,
    unsafe_allow_html=True,
)

# ---------- Helpers ----------
def parse_schedule(schedule_text: str) -> pd.DataFrame:
    if not schedule_text or schedule_text == "No schedule found":
        return pd.DataFrame(columns=["Start-End", "Course"])
    entries = [seg.strip() for seg in schedule_text.split(";") if seg.strip()]
    rows = []
    for e in entries:
        parts = e.split(" ", 1)
        if len(parts) == 2:
            rows.append({"Start-End": parts[0], "Course": parts[1]})
        else:
            rows.append({"Start-End": e, "Course": ""})
    return pd.DataFrame(rows)

# Ensure session state keys
st.session_state.setdefault("uploaded_image_bytes", None)
st.session_state.setdefault("processed_display_image", None)
st.session_state.setdefault("recognition_result", None)
st.session_state.setdefault("offline", False)

# ---------- Header ----------
st.markdown("<h1 class='title'>HallNav: Hall Recognition</h1>", unsafe_allow_html=True)
st.markdown("<div class='subtitle'>Upload an image to identify a lecture hall</div>", unsafe_allow_html=True)

st.markdown("<div class='container'>", unsafe_allow_html=True)

# ---------- 1. Camera Screen ----------
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
        # Cache original bytes in session for later Scan action
        st.session_state.uploaded_image_bytes = uploaded_file.getvalue()
        try:
            processed_image = process_uploaded_image(io.BytesIO(st.session_state.uploaded_image_bytes))
            st.session_state.processed_display_image = Image.fromarray((processed_image * 255).astype(np.uint8))
        except ValueError as e:
            st.session_state.processed_display_image = None
            st.markdown(f"<div class='alert-error'>Error processing image: {e}</div>", unsafe_allow_html=True)

with col_preview:
    if st.session_state.processed_display_image is not None:
        st.image(
            st.session_state.processed_display_image,
            caption="Uploaded Image",
            use_container_width=True,
        )

# Explicit Scan button centered
scan_col = st.columns([1, 1, 1])[1]
with scan_col:
    if st.button("Scan Hall", key="scan_button"):
        if st.session_state.uploaded_image_bytes is None:
            st.markdown("<div class='alert-error'>No image selected. Please upload an image.</div>", unsafe_allow_html=True)
        else:
            try:
                st.session_state.offline = False
                buf = io.BytesIO(st.session_state.uploaded_image_bytes)
                
                # Ensure we have a proper filename with extension
                filename = uploaded_file.name if uploaded_file.name else "uploaded_image.jpg"
                if not filename.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp', '.tiff')):
                    filename += ".jpg"  # Default to .jpg if no extension
                
                files = {"file": (filename, buf, "image/jpeg")}
                with st.spinner("Recognizing..."):
                    response = requests.post(
                        "http://127.0.0.1:8000/api/recognize_hall/",
                        files=files,
                        timeout=30,
                    )
                if response.status_code == 200:
                    result = response.json()
                    if result.get("status") == "success":
                        st.session_state.recognition_result = result
                    else:
                        st.session_state.recognition_result = None
                        st.markdown(f"<div class='alert-error'>{result.get('error', 'Recognition failed')}</div>", unsafe_allow_html=True)
                else:
                    st.session_state.recognition_result = None
                    try:
                        error_data = response.json()
                        error_message = error_data.get('error', 'Recognition failed. Please try another image.')
                        error_type = error_data.get('status', 'unknown')
                        
                        # Different styling for different error types
                        if error_type == 'validation_error':
                            st.markdown(f"<div class='alert-error'><strong>Validation Error:</strong> {error_message}</div>", unsafe_allow_html=True)
                        elif error_type == 'system_error':
                            st.markdown(f"<div class='alert-error'><strong>System Error:</strong> {error_message}</div>", unsafe_allow_html=True)
                        else:
                            st.markdown(f"<div class='alert-error'>{error_message}</div>", unsafe_allow_html=True)
                    except:
                        st.markdown("<div class='alert-error'>Recognition failed. Please try another image.</div>", unsafe_allow_html=True)
            except Exception as e:
                # Mark offline if API cannot be reached
                st.session_state.offline = True
                st.session_state.recognition_result = None
                st.markdown(f"<div class='alert-error'>Error contacting recognition service: {e}</div>", unsafe_allow_html=True)

# ---------- 2. Results Screen ----------
st.header("2. Results Screen")
if st.session_state.offline:
    st.markdown("<span class='badge-offline'>Offline Mode Active</span>", unsafe_allow_html=True)

if st.session_state.recognition_result:
    hall_id = st.session_state.recognition_result.get("hall_id", "Unknown")
    schedule_text = st.session_state.recognition_result.get("schedule", "No schedule found")

    # Card with hall name
    st.markdown("<div class='card'>", unsafe_allow_html=True)
    st.markdown(
        f"<h3 style='text-align:center; color:#424242; font-weight:700;'>Recognized Hall: {hall_id}</h3>",
        unsafe_allow_html=True,
    )

    # Schedule table or text
    df_schedule = parse_schedule(schedule_text)
    if not df_schedule.empty:
        st.dataframe(df_schedule, use_container_width=True, height=300)
    else:
        st.write(schedule_text)

    # Action buttons
    left, right = st.columns(2)
    with left:
        if st.button("Back to Upload", key="back_button"):
            st.session_state.recognition_result = None
            st.session_state.uploaded_image_bytes = None
            st.session_state.processed_display_image = None
    with right:
        st.button("Navigate to Hall", key="navigate_button", help="Opens navigation section below")
    st.markdown("</div>", unsafe_allow_html=True)
else:
    st.info("No hall recognized yet. Upload an image and click Scan Hall.")

# ---------- 3. Navigation Section ----------
st.header("3. Navigate Between Halls")
hall_names = list(HALL_LOCATIONS.keys())
col1, col2 = st.columns(2)
with col1:
    start_hall = st.selectbox("Start Location", hall_names, key="start")
with col2:
    # If we have a recognized hall, preselect as destination when available
    default_dest = hall_names.index(st.session_state.recognition_result["hall_id"]) if st.session_state.get("recognition_result") and st.session_state.recognition_result.get("hall_id") in hall_names else 0
    end_hall = st.selectbox("Destination Hall", hall_names, index=default_dest, key="end")

if st.button("Show Route"):
    if start_hall == end_hall:
        st.info("You are already at your destination.")
    else:
        try:
            route = compute_route(start_hall, end_hall)
            directions = get_turn_by_turn(route)
            coords = get_coordinates(route)

            st.subheader("Turn-by-Turn Directions:")
            for step in directions:
                st.write(step)

            st.subheader("Route Map")
            # Use map for visualization if coordinates available
            if coords:
                df_coords = pd.DataFrame(coords, columns=["lat", "lon"])  # interpret as lat/lon for demo
                st.map(df_coords, use_container_width=True)
            else:
                st.write("No coordinates available to plot.")
        except ValueError as e:
            st.markdown(f"<div class='alert-error'>Navigation error: {e}</div>", unsafe_allow_html=True)

st.caption("Accessibility: All controls are keyboard and screen reader friendly.")

st.markdown("</div>", unsafe_allow_html=True)
