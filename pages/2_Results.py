import streamlit as st
import pandas as pd
from components.ui import inject_css, render_header

st.set_page_config(page_title="HallNav • Results", layout="centered")
inject_css()
render_header("Hall Recognition Results", "Details for the identified lecture hall")

st.markdown("<div class='container'>", unsafe_allow_html=True)

if st.session_state.get("offline"):
	st.markdown("<span class='badge-offline'>Offline Mode Active</span>", unsafe_allow_html=True)

result = st.session_state.get("recognition_result")
if not result:
	st.markdown("<div class='alert-error'>No hall recognized. Please upload a valid image.</div>", unsafe_allow_html=True)
	st.stop()

hall_id = result.get("hall_id", "Unknown")
schedule_text = result.get("schedule", "No schedule found")

st.markdown("<div class='card'>", unsafe_allow_html=True)
st.markdown(f"<h3 style='text-align:center; color:#424242; font-weight:700;'>Recognized Hall: {hall_id}</h3>", unsafe_allow_html=True)

# Parse schedule into table
rows = []
if schedule_text and schedule_text != "No schedule found":
	entries = [seg.strip() for seg in schedule_text.split(";") if seg.strip()]
	for e in entries:
		parts = e.split(" ", 1)
		if len(parts) == 2:
			rows.append({"Start-End": parts[0], "Course": parts[1]})
	df = pd.DataFrame(rows)
	if not df.empty:
		st.dataframe(df, use_container_width=True, height=300)
	else:
		st.write(schedule_text)

left, right = st.columns(2)
with left:
	if st.button("Back to Upload", key="back_button"):
		st.session_state.recognition_result = None
		st.session_state.uploaded_image_bytes = None
		st.session_state.processed_display_image = None
		st.success("Cleared. Go to Upload page.")
with right:
	st.button("Navigate to Hall", key="navigate_button", help="Open the Navigation page from the sidebar")

st.markdown("</div>", unsafe_allow_html=True)
