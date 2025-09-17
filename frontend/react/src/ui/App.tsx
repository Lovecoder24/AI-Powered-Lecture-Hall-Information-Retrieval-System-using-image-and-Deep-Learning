import React, { useMemo, useState ,useEffect} from 'react'
import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getFirestore, type Firestore, collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, getDocs } from 'firebase/firestore'
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'


type RecognitionResult = {
  hall_id: string
  confidence: number
  schedule: string
  status: string
}

function useApiBaseUrl() {
  return useMemo(() => (import.meta as any).env?.VITE_API_BASE_URL || 'https://ai-powered-lecture-hall-information.onrender.com', [])
}

function useFirebase(): { app: FirebaseApp | null, db: Firestore | null } {
  return useMemo(() => {
    const env = (import.meta as any).env || {}
    const config = {
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: env.VITE_FIREBASE_APP_ID,
    }
    if (!config.apiKey || !config.projectId) return { app: null, db: null }
    const app = initializeApp(config)
    const db = getFirestore(app)
    return { app, db }
  }, [])
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface text-foreground">
      {/* Top navigation bar */}
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <img className="logo" src="/logo.png" alt="Logo" />
            <span className="brand-name">Modibbo Adama Lecture Hall Recognisation System</span>
          </div>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar" style={{ position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', flex: '0 0 260px' }}>
          {/* Sidebar header with logo and title */}
          <div className="sidebar-header">
            
            <h1 className="title" style={{ margin: 0 }}>HallNav</h1>
          </div>
          <nav className="sidebar-nav">
            <Link to="/" className="sidebar-link">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7"/><path d="M9 22V12h6v10"/></svg>
                <span>Home</span>
              </span>
            </Link>
            <Link to="/login" className="sidebar-link">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
                <span>Login</span>
              </span>
            </Link>
            <Link to="/info" className="sidebar-link">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="8"/></svg>
                <span>Info</span>
              </span>
            </Link>
            <Link to="/navigate" className="sidebar-link">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11h18"/><path d="M6 8l-3 3 3 3"/><circle cx="12" cy="19" r="2"/><path d="M12 3v14"/></svg>
                <span>Navigate</span>
              </span>
            </Link>
            <Link to="/admin" className="sidebar-link">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 7h10v10H7z"/></svg>
                <span>Admin</span>
              </span>
            </Link>
          </nav>
        </aside>
        <div className="content" style={{ height: '100vh', overflowY: 'auto' }}>
          <main>{children}</main>
          <footer className="footer">Accessibility: keyboard and screen reader friendly.</footer>
        </div>
      </div>
    </div>
  )
}

function LoginPage(): JSX.Element {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  return (
    <Shell>
      <section className="card" style={{ maxWidth: 420, margin: '0 auto' }}>
        <h2 style={{ marginTop: 0 }}>Login</h2>
        <div className="field"><label className="label">Username</label><input value={username} onChange={(e) => setUsername(e.target.value)} /></div>
        <div className="field"><label className="label">Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <button className="btn" onClick={() => navigate('/')}>Login</button>
      </section>
    </Shell>
  )
}

function HomePage(): JSX.Element {
  const apiBaseUrl = useApiBaseUrl()
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [dialog, setDialog] = useState<string | null>(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [collageIndex, setCollageIndex] = useState(0)
  const [showCamera, setShowCamera] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const navigate = useNavigate()

  // Hero images from your collection
  
  // School images for animated collage
   // Assume these are your imported image arrays
//const heroImages = []; 
// Your hero background images
const heroImages = [
  '/justin-.jpg',
  '/anastasiia-.jpg', 
  '/young-student-boy.jpg'
];
//const schoolImages = [];
//  // Your collage images

const schoolImages = [
  '/school.jpg',
  '/shool1.jpg', 
  '/school2.jpg',
  '/shool3.jpg',
  '/shool4.jpg',
  '/school5.jpg'
];


  // Auto-slide effect
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Animated collage cycling
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCollageIndex((prev) => (prev + 1) % schoolImages.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  async function handleScan() {
    if (!file) return
    setLoading(true)
    setDialog(null)
    const form = new FormData()
    form.append('file', file, file.name || 'uploaded_image.jpg')
    try {
      const res = await axios.post<RecognitionResult>(`${apiBaseUrl}/api/recognize_hall/`, form, { timeout: 30000 })
      if (res.data?.status === 'success') {
        setDialog('Recognized!')
        navigate('/info', { state: { result: res.data, image: previewUrl } })
      } else {
        setDialog(res.data as any)
      }
    } catch (e: any) {
      setDialog(e?.response?.data?.error || 'Image not recognized. Try again.')
    } finally {
      setLoading(false)
    }
  }

  // Auto-dismiss dialog after a short delay
  React.useEffect(() => {
    if (!dialog) return
    const t = setTimeout(() => setDialog(null), 2000)
    return () => clearTimeout(t)
  }, [dialog])

  // Camera functions
  async function startCamera() {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      setStream(mediaStream)
      setShowCamera(true)
      setCameraReady(false)
      const v = videoRef.current || document.createElement('video')
      v.setAttribute('playsinline', 'true')
      v.muted = true
      v.autoplay = true
      ;(v as any).srcObject = mediaStream as any
      await new Promise<void>((resolve) => {
        (v as HTMLVideoElement).onloadedmetadata = () => {
          if (!(v as HTMLVideoElement).videoWidth) {
            // iOS Safari sometimes needs an extra kick
            try { (v as HTMLVideoElement).play().catch(() => {}) } catch {}
          }
          resolve()
        }
      })
      try { await (v as HTMLVideoElement).play() } catch {}
      // Wait for a first frame to render
      await new Promise<void>((resolve) => setTimeout(resolve, 120))
      videoRef.current = v as HTMLVideoElement
      setCameraReady(true)
    } catch (error) {
      console.error('Error accessing camera:', error)
      setDialog('Camera access denied or not available. Please use file upload instead.')
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setShowCamera(false)
    setCameraReady(false)
    if (videoRef.current) {
      try { (videoRef.current as any).srcObject = null } catch {}
      videoRef.current = null
    }
  }

  async function capturePhoto() {
    if (canvasRef.current) {
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      if (!cameraReady || !context) {
        setDialog('Camera is not ready yet. Please wait a moment and try again.')
        return
      }

      // Draw from on-screen/offscreen video element
      const video = videoRef.current
      if (!video) { setDialog('Camera is not available.'); return }
      // Ensure we have frame dimensions
      // wait briefly for first frame if needed
      if (!video.videoWidth || !video.videoHeight) {
        await new Promise((r) => setTimeout(r, 200))
      }
      if (!video.videoWidth || !video.videoHeight) {
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      }
      if (!video.videoWidth || !video.videoHeight) {
        setDialog('Unable to capture a frame. Please try again.')
        return
      }
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context.drawImage(video, 0, 0)
      try {
        const dataUrl = canvas.toDataURL('image/png')
        setPreviewUrl(dataUrl)
      } catch {}
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'camera_capture.jpg', { type: 'image/jpeg' })
          setFile(file)
        }
      }, 'image/jpeg', 0.9)
      stopCamera()
    }
  }

  // Cleanup camera stream on unmount
  React.useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream])


 

  return (
    <Shell>
      <div className="home-container">
        {/* Hero Section with Sliding Images */}
        <section className="hero-section">
          <div className="hero-slider">
            {heroImages.map((image, index) => (
              <div
                key={index}
                className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
                style={{ backgroundImage: `url(${image})` }}
              />
            ))}
          </div>

          <div className='hero-overlay' />
          <div className="hero-content two-column-layout">
            
            {/* Left Div for Write-up */}
            <div className="hero-left-column">
              <div className="hero-text" style={{ flex: '1 1 320px', minWidth: 260 }}>
                <h1 className="hero-main-title">University Hall Recognition</h1>
                <p className="hero-main-subtitle">
                  Instantly identify university lecture halls and get real-time schedules, capacity, and location details.
                </p>
              </div>
            </div>

            {/* Right Div for Image Collage */}
            <div className="hero-right-column">
              <div className="hero-side-image">
                {/* The following mapping is redundant and causing issues */}
                {/* It seems you want to render a few images with different styles */}
                {/* I'll use the original collage logic here */}
                <img
                  src={schoolImages[(collageIndex) % schoolImages.length]}
                  alt="School collage 1"
                  style={{
                    position: 'absolute',
                    width: '60%',
                    height: 'auto',
                    borderRadius: '1rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    transform: 'rotate(-6deg)',
                    animation: 'moveAndFade 20s infinite ease-in-out'
                  }}
                />
                <img
                  src={schoolImages[(collageIndex + 1) % schoolImages.length]}
                  alt="School collage 2"
                  style={{
                    position: 'absolute',
                    width: '60%',
                    height: 'auto',
                    borderRadius: '1rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    transform: 'rotate(3deg) translateY(-20px)',
                    animation: 'moveAndFade 20s infinite ease-in-out'
                  }}
                />
                <img
                  src={schoolImages[(collageIndex + 2) % schoolImages.length]}
                  alt="School collage 3"
                  style={{
                    position: 'absolute',
                    width: '60%',
                    height: 'auto',
                    borderRadius: '1rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    transform: 'rotate(12deg) translateY(20px)',
                    animation: 'moveAndFade 15s infinite ease-in-out'
                  }}
                />
                {/* Animated collage overlay */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'right',
                  justifyContent: 'right',
                  zIndex: 2
                }} />
              </div>
            </div>
          </div>
        </section>


        {/* Main Actions Section */}
        <main className="home-main">
          <div className="actions-grid">
            {/* Upload Card */}
            <div className="action-card" onClick={() => document.getElementById('file-input')?.click()}>
              <div className="card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
                  <path d="M12 12v9"></path>
                  <path d="m8 17 4 4 4-4"></path>
                </svg>
              </div>
              <h2 className="card-title">Upload Photo / Video</h2>
              <p className="card-description">
                Select a file from your device to instantly recognize the lecture hall.
              </p>
              <input 
                id="file-input" 
                type="file" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={(e) => {
                  const f = e.target.files?.[0] || null
                  setFile(f)
                  setPreviewUrl(f ? URL.createObjectURL(f) : null)
                }} 
              />
            </div>

            {/* Capture Card */}
            <div className="action-card" onClick={startCamera}>
              <div className="card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                  <circle cx="12" cy="13" r="3"></circle>
                </svg>
              </div>
              <h2 className="card-title">Capture Live Stream</h2>
              <p className="card-description">
                Use your device's camera for real-time recognition of the hall.
              </p>
            </div>
          </div>

          {/* Preview and Processing Section */}
          {previewUrl && (
            <div className="preview-section">
              <div className="preview-card">
                <h3 className="preview-title">Image Preview</h3>
                <img src={previewUrl} alt="Preview" className="preview-image" />
                <button 
                  className="btn btn-large" 
                  disabled={loading} 
                  onClick={handleScan}
                >
                  {loading ? 'Processing…' : 'Scan & Recognize'}
                </button>
              </div>
            </div>
          )}

          {/* Camera Interface */}
          {showCamera && (
            <div className="camera-modal">
              <div className="camera-container">
                <div className="camera-header">
                  <h3>Camera Capture</h3>
                  <button className="camera-close" onClick={stopCamera}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
                <div className="camera-preview">
                  <video 
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="camera-video"
                    style={{ width: '100%', height: 'auto', borderRadius: 12 }}
                  />
                  {!cameraReady && (
                    <div className="label" style={{ position: 'absolute', bottom: 8, left: 8, right: 8, textAlign: 'center', opacity: 0.9 }}>
                      Initializing camera…
                    </div>
                  )}
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                </div>
                <div className="camera-controls">
                  <button className="btn btn-large camera-capture-btn" onClick={capturePhoto}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"></path>
                    </svg>
                    Capture Photo
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Message Box */}
          {dialog && (
            <div className="message-box">
              <p className="message-text">{dialog}</p>
            </div>
          )}
        </main>
      </div>
    </Shell>
  )
}

function InfoPage(): JSX.Element {
  const location = useLocation() as any
  const data = (location.state || {}) as { result?: RecognitionResult, image?: string }
  const navigate = useNavigate()
  const hall = data.result
  const [hallDetails, setHallDetails] = useState<any | null>(null)
  const { db } = useFirebase()

  React.useEffect(() => {
    const target = hall?.hall_id || ''
    if (!target) return
    if (!db) return
    ;(async () => {
      const snap = await getDocs(collection(db, 'halls'))
      const list: any[] = []
      snap.forEach(d => list.push({ id: d.id, ...d.data() }))
      const byExact = list.find(h => (h.name || '').toLowerCase() === target.toLowerCase())
      const match = byExact || list.find(h => (h.name || '').toLowerCase().includes(target.toLowerCase())) || null
      setHallDetails(match)
    })()
  }, [db, hall?.hall_id])
  return (
    <Shell>
      <div className="info-container">
        <div className="info-card">
          {/* Header Section */}
          <header className="info-header">
            <h1 className="info-title">Hall Recognition Results</h1>
            <p className="info-subtitle">Details for the recognized lecture hall.</p>
          </header>

          {/* Main Content Section */}
          <main className="info-main">
            {/* Hall Name and Image Section */}
            <div className="hall-hero">
              <div className="hall-info">
                <h2 className="hall-name">{hallDetails?.name || hall?.hall_id || 'Unknown Hall'}</h2>
                <p className="hall-location">{hallDetails?.location || 'Modibbo Adama University, Yola Campus'}</p>
                {hallDetails?.description && (
                  <p className="caption" style={{ marginTop: 8 }}>{hallDetails.description}</p>
                )}
              </div>
              <div className="hall-image-container">
                {data.image ? (
                  <img src={data.image} alt="Recognized Lecture Hall" className="hall-image" />
                ) : (
                  <div className="hall-image-placeholder">No image available</div>
                )}
              </div>
            </div>

            {/* Details Section - Information cards */}
            <div className="details-grid">
              {/* Schedule Card */}
              <div className="detail-card schedule-card">
                <div className="card-header">
                  <svg className="card-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <h3 className="card-title">Current Schedule</h3>
                </div>
                <div className="schedule-content">
                  {hall?.schedule && hall.schedule !== 'No schedule found' ? (
                    <p className="schedule-text">{hall.schedule}</p>
                  ) : hallDetails?.schedule ? (
                    <p className="schedule-text">{hallDetails.schedule}</p>
                  ) : (
                    <p className="schedule-text">No schedule available</p>
                  )}
                </div>
              </div>

              {/* Capacity Card */}
              <div className="detail-card capacity-card">
                <div className="card-header">
                  <svg className="card-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <h3 className="card-title">Capacity</h3>
                </div>
                <p className="capacity-text">{hallDetails?.capacity || 'N/A'}</p>
              </div>

              {/* Features Card */}
              <div className="detail-card features-card">
                <div className="card-header">
                  <svg className="card-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="8" y1="13" x2="16" y2="13"></line>
                    <line x1="8" y1="17" x2="16" y2="17"></line>
                    <line x1="10" y1="9" x2="10" y2="9"></line>
                  </svg>
                  <h3 className="card-title">Features</h3>
                </div>
                <ul className="features-list">
                  {(hallDetails?.features || [
                    'Projector with HDMI',
                    'Whiteboard and markers',
                    'High-speed Wi-Fi',
                    'Air conditioning',
                    'Sound system'
                  ]).map((f: string, i: number) => (
                    <li key={i} className="feature-item">{f}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Navigation Button */}
            <div className="info-actions">
              <button className="btn btn-large" onClick={() => navigate('/navigate', { state: { hall: hall?.hall_id } })}>
                Navigate to Hall
              </button>
            </div>
          </main>
        </div>
      </div>
    </Shell>
  )
}

function NavigationPage(): JSX.Element {
  const location = useLocation() as any
  const { hall } = (location.state || {}) as { hall?: string }
  const navigate = useNavigate()
  const [fromLocation, setFromLocation] = useState('')
  const [toLocation, setToLocation] = useState(hall || '')
  const [showDirections, setShowDirections] = useState(false)
  const [directions, setDirections] = useState<string[]>([])
  const [message, setMessage] = useState('')

  // Guided navigation additions
  const campusLocations = [
    { id: 'lt1', name: 'LT1 & 2', lat: 34.0522, lon: -118.2437 },
    { id: 'lt3', name: 'LT3 & 4', lat: 34.045, lon: -118.235 }
  ]
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<typeof campusLocations>([])
  const [currentDestination, setCurrentDestination] = useState<typeof campusLocations[number] | null>(null)
  const [statusText, setStatusText] = useState('Initializing...')
  const [distanceText, setDistanceText] = useState('Calculating distance...')
  const [userCoords, setUserCoords] = useState<{ lat: number, lon: number } | null>(null)
  const [geminiVisible, setGeminiVisible] = useState(false)
  const [geminiText, setGeminiText] = useState('')
  const mapContainerRef = React.useRef<HTMLDivElement | null>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [userMarker, setUserMarker] = useState<any>(null)
  const [destinationMarker, setDestinationMarker] = useState<any>(null)
  const [pathLine, setPathLine] = useState<any>(null)
  const [routingControl, setRoutingControl] = useState<any>(null)
  const STADIA_API_KEY = 'b2151c2d-0573-4e0a-8a8a-7f940cbc8e05'

  function executeSearch() {
    const q = searchQuery.trim().toLowerCase()
    if (!q) {
      setSearchResults([])
      return
    }
    const filtered = campusLocations.filter(l => l.name.toLowerCase().includes(q))
    setSearchResults(filtered)
  }

  React.useEffect(() => {
    if (hall) {
      setToLocation(hall)
    }
  }, [hall])

  const handleGetDirections = () => {
    if (!fromLocation.trim() || !toLocation.trim()) {
      setMessage('Please enter both a starting and ending location.')
      setTimeout(() => setMessage(''), 1500)
      return
    }

    setMessage('Calculating the best route...')
    setShowDirections(false)
    
    // Simulate API call
    setTimeout(() => {
      const mockDirections = [
        `Start at ${fromLocation}`,
        'Walk north on University Drive',
        'Turn left at the first intersection',
        'Continue for 200 meters',
        `Destination is on your right: ${toLocation}`
      ]
      setDirections(mockDirections)
      setShowDirections(true)
      setMessage('')
    }, 2000)
  }

  function calculateDistance(a: { lat: number, lon: number }, b: { lat: number, lon: number }) {
    const R = 6371e3
    const phi1 = a.lat * Math.PI / 180
    const phi2 = b.lat * Math.PI / 180
    const dPhi = (b.lat - a.lat) * Math.PI / 180
    const dLambda = (b.lon - a.lon) * Math.PI / 180
    const s = Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))
    return R * c
  }

  function selectDestination(loc: typeof campusLocations[number]) {
    setCurrentDestination(loc)
    setToLocation(loc.name)
    setSearchQuery(loc.name)
    setSearchResults([])
    const L: any = (window as any).L
    if (L && mapInstance) {
      if (destinationMarker) {
        mapInstance.removeLayer(destinationMarker)
      }
      const newDest = L.marker([loc.lat, loc.lon]).addTo(mapInstance).bindPopup(`<b>${loc.name}</b>`)
      setDestinationMarker(newDest)
      if (userMarker) {
        const bounds = L.latLngBounds([userMarker.getLatLng(), newDest.getLatLng()])
        mapInstance.fitBounds(bounds, { padding: [50, 50] })
      } else {
        mapInstance.setView([loc.lat, loc.lon], 16)
      }
      drawPath()
    }
    if (userCoords) {
      const dMeters = calculateDistance(userCoords, { lat: loc.lat, lon: loc.lon })
      const dKm = (dMeters / 1000).toFixed(2)
      setDistanceText(`Distance to ${loc.name}: ${dKm} km`)
    } else {
      setDistanceText('Waiting for your location...')
    }
  }

  function drawPath() {
    const L: any = (window as any).L
    if (!L || !mapInstance) return
    if (pathLine) {
      mapInstance.removeLayer(pathLine)
      setPathLine(null)
    }
    if (userMarker && destinationMarker) {
      const coords = [userMarker.getLatLng(), destinationMarker.getLatLng()]
      const line = L.polyline(coords, { color: '#22c55e', weight: 5 })
      line.addTo(mapInstance)
      setPathLine(line)
    }
  }

  React.useEffect(() => {
    if (hall) {
      setToLocation(hall)
    }
  }, [hall])

  React.useEffect(() => {
    // Geolocation watch (no external libs required)
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          const coords = { lat: latitude, lon: longitude }
          setUserCoords(coords)
          setStatusText('You are here!')
          const L: any = (window as any).L
          if (L && mapInstance) {
            if (!userMarker) {
              const marker = L.circleMarker([latitude, longitude], {
                radius: 8,
                color: '#2563eb',
                fillColor: '#2563eb',
                fillOpacity: 0.8
              }).addTo(mapInstance).bindPopup('<b>You are here!</b>')
              setUserMarker(marker)
              mapInstance.setView([latitude, longitude])
            } else {
              userMarker.setLatLng([latitude, longitude])
              mapInstance.setView([latitude, longitude])
            }
            drawPath()
          }
          if (currentDestination) {
            const dMeters = calculateDistance(coords, { lat: currentDestination.lat, lon: currentDestination.lon })
            const dKm = (dMeters / 1000).toFixed(2)
            setDistanceText(`Distance to ${currentDestination.name}: ${dKm} km`)
          } else {
            setDistanceText('Search for a location to get started.')
          }
        },
        (error) => {
          let msg = ''
          if (error.code === error.PERMISSION_DENIED) msg = 'Permission to access location was denied. Please enable it in your browser settings.'
          else if (error.code === error.POSITION_UNAVAILABLE) msg = 'Location information is unavailable.'
          else if (error.code === error.TIMEOUT) msg = 'The request to get user location timed out.'
          else msg = 'An unknown error occurred.'
          setStatusText('Error')
          setDistanceText(msg)
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      )
      return () => navigator.geolocation.clearWatch(watchId)
    } else {
      setStatusText('Error')
      setDistanceText('Geolocation is not supported by your browser.')
    }
  }, [currentDestination])

  // Load Leaflet from CDN and initialize map
  React.useEffect(() => {
    function ensureLeafletLoaded(): Promise<void> {
      return new Promise((resolve) => {
        const w = window as any
        // Load Leaflet core and Routing Machine if needed
        const maybeResolve = () => {
          if (w.L && w.L.Routing) resolve()
        }
        if (w.L && w.L.Routing) return resolve()
        const cssId = 'leaflet-css-cdn'
        const jsId = 'leaflet-js-cdn'
        const lrmCssId = 'leaflet-routing-css-cdn'
        const lrmJsId = 'leaflet-routing-js-cdn'
        if (!document.getElementById(cssId)) {
          const link = document.createElement('link')
          link.id = cssId
          link.rel = 'stylesheet'
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
          document.head.appendChild(link)
        }
        if (!document.getElementById(jsId)) {
          const script = document.createElement('script')
          script.id = jsId
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
          script.async = true
          script.onload = () => {
            // After Leaflet, load Routing Machine
            if (!document.getElementById(lrmCssId)) {
              const lrmCss = document.createElement('link')
              lrmCss.id = lrmCssId
              lrmCss.rel = 'stylesheet'
              lrmCss.href = 'https://unpkg.com/leaflet-routing-machine/dist/leaflet-routing-machine.css'
              document.head.appendChild(lrmCss)
            }
            if (!document.getElementById(lrmJsId)) {
              const lrm = document.createElement('script')
              lrm.id = lrmJsId
              lrm.src = 'https://unpkg.com/leaflet-routing-machine/dist/leaflet-routing-machine.js'
              lrm.async = true
              lrm.onload = () => maybeResolve()
              document.body.appendChild(lrm)
            } else {
              maybeResolve()
            }
          }
          document.body.appendChild(script)
        } else {
          const existing = document.getElementById(jsId) as HTMLScriptElement
          if (existing && (window as any).L) {
            if (!document.getElementById(lrmCssId)) {
              const lrmCss = document.createElement('link')
              lrmCss.id = lrmCssId
              lrmCss.rel = 'stylesheet'
              lrmCss.href = 'https://unpkg.com/leaflet-routing-machine/dist/leaflet-routing-machine.css'
              document.head.appendChild(lrmCss)
            }
            if (!document.getElementById(lrmJsId)) {
              const lrm = document.createElement('script')
              lrm.id = lrmJsId
              lrm.src = 'https://unpkg.com/leaflet-routing-machine/dist/leaflet-routing-machine.js'
              lrm.async = true
              lrm.onload = () => maybeResolve()
              document.body.appendChild(lrm)
            } else {
              maybeResolve()
            }
          } else existing?.addEventListener('load', () => maybeResolve(), { once: true })
        }
      })
    }

    let disposed = false
    ensureLeafletLoaded().then(() => {
      if (disposed) return
      const L: any = (window as any).L
      if (!mapInstance && mapContainerRef.current) {
        const map = L.map(mapContainerRef.current).setView([campusLocations[0].lat, campusLocations[0].lon], 16)
        // Base layers with Stadia key and Esri satellite
        const stadiaSmooth = L.tileLayer(`https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?api_key=${STADIA_API_KEY}`, {
          maxZoom: 20,
          attribution: '&copy; Stadia Maps, &copy; OpenMapTiles &copy; OpenStreetMap contributors'
        })
        const esriSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles &copy; Esri'
        })
        stadiaSmooth.addTo(map)
        L.control.layers({ 'Campus Map': stadiaSmooth, 'Satellite View': esriSatellite }).addTo(map)
        // Add destination markers
        campusLocations.forEach(loc => {
          const marker = L.marker([loc.lat, loc.lon]).addTo(map).bindPopup(`<b>${loc.name}</b>`)
          marker.on('click', () => selectDestination(loc))
        })
        setMapInstance(map)
        // Ensure Leaflet sizes correctly once visible
        setTimeout(() => { try { map.invalidateSize() } catch {} }, 0)
      }
    })

    return () => { disposed = true }
  }, [])

  // Invalidate map size on window resize to keep it filling the area
  React.useEffect(() => {
    const handler = () => {
      try { mapInstance?.invalidateSize() } catch {}
    }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [mapInstance])

  return (
    <Shell>
      <div className="navigation-container">
        <div className="navigation-grid" style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          {/* Left: Search and Actions Panel */}
          <div className="directions-panel" style={{ flex: '1 1 320px', maxWidth: '100%' }}>
            <h2 className="panel-title">Get Directions</h2>
            
            {/* Search */}
            <div className="input-field">
              <label htmlFor="searchLocation" className="input-label">Search for a building</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  id="searchLocation"
                  className="input-control"
                  placeholder="e.g., LT1 & 2"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      executeSearch()
                    }
                  }}
                />
                <button className="btn" onClick={executeSearch}>Search</button>
              </div>
              {searchResults.length > 0 && (
                <div className="card" style={{ marginTop: 8, maxHeight: 180, overflowY: 'auto' }}>
                  {searchResults.map(loc => (
                    <div key={loc.id} className="sidebar-link" onClick={() => selectDestination(loc)}>
                      {loc.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Manual inputs remain for brand consistency */}
            <div className="input-group" style={{ marginTop: 12 }}>
              <div className="input-field">
                <label htmlFor="from-input" className="input-label">Your Location</label>
                <input 
                  type="text" 
                  id="from-input" 
                  className="input-control"
                  placeholder="e.g., Main Entrance"
                  value={fromLocation}
                  onChange={(e) => setFromLocation(e.target.value)}
                />
              </div>
              <div className="input-field">
                <label htmlFor="to-input" className="input-label">Destination</label>
                <input 
                  type="text" 
                  id="to-input" 
                  className="input-control"
                  placeholder="e.g., Adams Hall - Room 301"
                  value={toLocation}
                  onChange={(e) => setToLocation(e.target.value)}
                />
              </div>
            </div>

            {/* Action buttons (brand color intact through existing classes) */}
            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <button className="btn" onClick={() => {
                // Build routed path via OSRM using Leaflet Routing Machine
                const L: any = (window as any).L
                if (!L || !mapInstance || !userCoords || !currentDestination) {
                  setGeminiVisible(true)
                  setGeminiText('Please wait for your location and select a destination first.')
                  return
                }
                try {
                  if (routingControl) {
                    mapInstance.removeControl(routingControl)
                    setRoutingControl(null)
                  }
                  const control = L.Routing.control({
                    waypoints: [
                      L.latLng(userCoords.lat, userCoords.lon),
                      L.latLng(currentDestination.lat, currentDestination.lon)
                    ],
                    router: L.Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1' }),
                    lineOptions: { styles: [{ color: '#22c55e', opacity: 1, weight: 6 }] },
                    fitSelectedRoutes: true,
                    show: true,
                    language: 'en'
                  }).addTo(mapInstance)
                  setRoutingControl(control)
                } catch (e) {
                  setGeminiVisible(true)
                  setGeminiText('Unable to calculate route right now. Please try again shortly.')
                }
              }}>Get Directions</button>
              <button className="btn" onClick={() => {
                if (!currentDestination) {
                  setGeminiVisible(true)
                  setGeminiText('Please select a destination first.')
                  return
                }
                // Placeholder info text; integrate API later if desired
                setGeminiVisible(true)
                setGeminiText(`About ${currentDestination.name}: A key lecture theatre complex used for classes and examinations. Expect modern facilities and student services nearby.`)
              }}>Learn About Destination</button>
            </div>

            {/* Directions list */}
            {showDirections && (
              <div className="directions-results">
                <h3 className="results-title">Route Details</h3>
                <ul className="directions-list">
                  {directions.map((step, index) => (
                    <li key={index} className="direction-step">
                      <span className="step-number">{index + 1}.</span>
                      <span className="step-text">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Gemini-like output box */}
            {geminiVisible && (
              <div className="card" style={{ marginTop: 12 }}>
                <div className="label" style={{ marginBottom: 8 }}>Info</div>
                <div className="caption" style={{ whiteSpace: 'pre-wrap' }}>{geminiText}</div>
              </div>
            )}
          </div>

          {/* Right: Interactive Map (Leaflet) */}
          <div className="map-section" style={{ flex: '2 1 480px', minWidth: 320 }}>
            <div className="map-container" style={{ height: '50vh', minHeight: 360 }}>
              <div className="map-overlay">
                <div id="map" ref={mapContainerRef} style={{ height: '100%', width: '100%', borderRadius: 12 }} />
              </div>
            </div>
            {/* Status box */}
            <div className="card" style={{ marginTop: 16 }}>
              <div className="label" style={{ marginBottom: 8 }}>{statusText}</div>
              <div className="caption" style={{ opacity: 0.8 }}>{distanceText}</div>
            </div>
          </div>
        </div>

        {/* Navigation Actions */}
        <div className="navigation-actions">
          <button className="btn" onClick={() => navigate('/')}>Back to Home</button>
          <button className="btn" onClick={() => navigate(-1)}>Back to Info Page</button>
        </div>

        {/* Message Box */}
        {message && (
          <div className="nav-message-box">
            <p className="nav-message-text">{message}</p>
          </div>
        )}
      </div>
    </Shell>
  )
}

function AdminPage(): JSX.Element {
  const navigate = useNavigate()
  const { db } = useFirebase()
  const [halls, setHalls] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [hallName, setHallName] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')

  React.useEffect(() => {
    if (!db) { setLoading(false); return }
    const col = collection(db, 'halls')
    const unsub = onSnapshot(col, (snap) => {
      const items: any[] = []
      snap.forEach((d) => items.push({ id: d.id, ...d.data() }))
      setHalls(items)
      setLoading(false)
    })
    return () => unsub()
  }, [db])

  async function addHall(e: React.FormEvent) {
    e.preventDefault()
    if (!db) return
    await addDoc(collection(db, 'halls'), { name: hallName, location, description })
    setHallName(''); setLocation(''); setDescription('')
  }

  async function removeHall(id: string) {
    if (!db) return
    await deleteDoc(doc(db, 'halls', id))
  }

  async function saveHall(id: string, data: any) {
    if (!db) return
    await updateDoc(doc(db, 'halls', id), data)
  }

  return (
    <Shell>
      <div className="info-container">
        <div className="info-card" style={{ maxWidth: 960, margin: '0 auto' }}>
          <header className="info-header">
            <h1 className="info-title">Lecture Hall Admin Panel</h1>
            <p className="info-subtitle">Add, update, and delete halls.</p>
          </header>

          <main className="info-main">
            {/* Add Hall */}
            <form className="card" onSubmit={addHall} style={{ padding: 16, marginBottom: 16 }}>
              <div className="input-group">
                <div className="input-field">
                  <label className="input-label">Hall Name</label>
                  <input className="input-control" value={hallName} onChange={(e) => setHallName(e.target.value)} required />
                </div>
                <div className="input-field">
                  <label className="input-label">Location</label>
                  <input className="input-control" value={location} onChange={(e) => setLocation(e.target.value)} required />
                </div>
              </div>
              <div className="input-field">
                <label className="input-label">Description</label>
                <textarea className="input-control" value={description} onChange={(e) => setDescription(e.target.value)} required />
              </div>
              <button className="btn" type="submit">Add Hall</button>
            </form>

            {/* Halls List */}
            <div className="details-grid">
              {loading ? (
                <div className="card" style={{ padding: 16 }}>Loading…</div>
              ) : halls.length === 0 ? (
                <div className="card" style={{ padding: 16 }}>No halls yet.</div>
              ) : (
                halls.map((h) => (
                  <div key={h.id} className="detail-card" style={{ padding: 16 }}>
                    <div className="card-header"><h3 className="card-title">{h.name}</h3></div>
                    <p className="caption">{h.location}</p>
                    <p className="caption">{h.description}</p>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                      <button className="btn" onClick={() => {
                        const name = prompt('New name', h.name) || h.name
                        const loc = prompt('New location', h.location) || h.location
                        const desc = prompt('New description', h.description) || h.description
                        saveHall(h.id, { name, location: loc, description: desc })
                      }}>Update</button>
                      <button className="btn" onClick={() => removeHall(h.id)}>Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="info-actions">
              <button className="btn" onClick={() => navigate('/')}>Back to Home</button>
            </div>
          </main>
        </div>
      </div>
    </Shell>
  )
}

export default function App(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/info" element={<InfoPage />} />
      <Route path="/navigate" element={<NavigationPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  )
}


