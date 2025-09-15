import 'package:flutter/material.dart';
import 'package:camera/camera.dart';

class HallNavMVP extends StatefulWidget {
  @override
  _HallNavMVPState createState() => _HallNavMVPState();
}

class _HallNavMVPState extends State<HallNavMVP> {
  CameraController? _controller;
  Future<void>? _initializeControllerFuture;
  String? _hallId;

  @override
  void initState() {
    super.initState();
    _initializeCamera();
  }

  Future<void> _initializeCamera() async {
    try {
      final cameras = await availableCameras();
      _controller = CameraController(cameras[0], ResolutionPreset.medium);
      _initializeControllerFuture = _controller!.initialize();
      setState(() {});
    } catch (e) {
      _showError('Camera initialization failed: $e');
    }
  }

  Future<void> _captureAndRecognize() async {
    try {
      await _initializeControllerFuture;
      final image = await _controller!.takePicture();
      // Mock recognition (real TFLite integration in Development Phase)
      setState(() {
        _hallId = 'Hall_A101'; // Simulated output
      });
    } catch (e) {
      _showError('Capture failed: $e');
    }
  }

  void _showError(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Error'),
        content: Text(message),
        actions: [TextButton(onPressed: () => Navigator.pop(context), child: Text('OK'))],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: FutureBuilder(
        future: _initializeControllerFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.done) {
            return Column(
              children: [
                CameraPreview(_controller!),
                ElevatedButton(
                  onPressed: _captureAndRecognize,
                  child: Text('Scan Hall'),
                ),
                if (_hallId != null) Text('Recognized: $_hallId'),
              ],
            );
          }
          return Center(child: CircularProgressIndicator());
        },
      ),
    );
  }
}