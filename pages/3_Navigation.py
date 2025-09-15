import streamlit as st
import pandas as pd
from navigation import compute_route, get_turn_by_turn, get_coordinates, HALL_LOCATIONS
from components.ui import inject_css, render_header

st.set_page_config(page_title="HallNav • Navigation", layout="centered")
inject_css()
render_header("Navigate Between Halls", "Select a start and destination hall")

st.markdown("<div class='container'>", unsafe_allow_html=True)

hall_names = list(HALL_LOCATIONS.keys())
col1, col2 = st.columns(2)
with col1:
	start_hall = st.selectbox("Start Location", hall_names, key="start")
with col2:
	default_dest = 0
	if st.session_state.get("recognition_result") and st.session_state.recognition_result.get("hall_id") in hall_names:
		default_dest = hall_names.index(st.session_state.recognition_result["hall_id"])
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
			if coords:
				df_coords = pd.DataFrame(coords, columns=["lat", "lon"])  # interpret as lat/lon for demo
				st.map(df_coords, use_container_width=True)
			else:
				st.write("No coordinates available to plot.")
		except ValueError as e:
			st.error(f"Navigation error: {e}")

st.markdown("</div>", unsafe_allow_html=True)
