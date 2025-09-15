import streamlit as st

def inject_css(path: str = "styles/theme.css") -> None:
	try:
		with open(path, "r", encoding="utf-8") as f:
			st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)
	except Exception:
		pass


def render_header(title: str, subtitle: str) -> None:
	st.markdown(f"<h1 class='title'>{title}</h1>", unsafe_allow_html=True)
	st.markdown(f"<div class='subtitle'>{subtitle}</div>", unsafe_allow_html=True)
