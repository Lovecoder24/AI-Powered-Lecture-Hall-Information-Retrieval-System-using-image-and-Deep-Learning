# HallNav Integration Flow

1. User uploads image via Streamlit UI.
2. Streamlit sends image to Django API endpoint `/api/recognize_hall/`.
3. Django API runs (mock) TFLite inference and returns hall ID and schedule.
4. Streamlit displays results to user.
