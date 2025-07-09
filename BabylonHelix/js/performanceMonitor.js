/**
 * Performance Monitor
 * 
 * Monitors and records performance metrics for the Babylon.js helix application.
 * Tracks FPS, frame times, memory usage, and provides data export functionality.
 * 
 * @author [Your Name]
 * @date [Current Date]
 * @version 1.0
 */

class PerformanceMonitor {
    constructor() {
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 0;
        this.frameTime = 0;
        this.testData = [];
        this.isTestRunning = false;
        this.testStartTime = 0;
        this.testDuration = 30000; // 30 seconds
        
        // Performance thresholds
        this.performanceThresholds = {
            excellent: 55,
            good: 45,
            acceptable: 30,
            poor: 20
        };
    }

    /**
     * Updates performance statistics
     * Should be called every frame
     */
    update() {
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        
        this.frameCount++;
        this.frameTime = deltaTime;
        
        // Update FPS every second
        if (deltaTime >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / deltaTime);
            this.frameCount = 0;
            this.lastTime = currentTime;
            
            // Update UI display
            this.updateDisplay();
            
            // Record test data if running
            if (this.isTestRunning) {
                this.recordTestData();
            }
        }
    }

    /**
     * Updates the performance display in the UI
     */
    updateDisplay() {
        // Update FPS and frame time
        document.getElementById('fps').textContent = this.fps;
        document.getElementById('frame-time').textContent = this.frameTime.toFixed(1);
        
        // Update memory usage (if available)
        const memory = this.getMemoryUsage();
        document.getElementById('memory').textContent = memory;
        
        // Update performance grade
        const grade = this.getPerformanceGrade(this.fps);
        const gradeElement = document.getElementById('performance-grade');
        gradeElement.textContent = grade.grade;
        gradeElement.style.backgroundColor = grade.color;
        gradeElement.style.color = grade.grade === 'A' || grade.grade === 'B' ? '#000' : '#fff';
    }

    /**
     * Gets current memory usage in MB
     * @returns {number} Memory usage in MB
     */
    getMemoryUsage() {
        if (window.performance && window.performance.memory) {
            return Math.round(window.performance.memory.usedJSHeapSize / 1024 / 1024);
        }
        return 0;
    }

    /**
     * Calculates performance grade based on FPS
     * @param {number} fps - Current FPS
     * @returns {Object} Grade object with grade letter and color
     */
    getPerformanceGrade(fps) {
        const { excellent, good, acceptable, poor } = this.performanceThresholds;
        
        if (fps >= excellent) return { grade: 'A', color: '#4CAF50' };
        if (fps >= good) return { grade: 'B', color: '#8BC34A' };
        if (fps >= acceptable) return { grade: 'C', color: '#FFC107' };
        if (fps >= poor) return { grade: 'D', color: '#FF9800' };
        return { grade: 'F', color: '#F44336' };
    }

    /**
     * Starts a performance test
     * @param {number} duration - Test duration in milliseconds (default: 30000)
     */
    startTest(duration = this.testDuration) {
        if (this.isTestRunning) {
            console.warn('⚠️ Test already running');
            return false;
        }
        
        console.log(`🧪 Starting ${duration/1000}s performance test...`);
        
        this.isTestRunning = true;
        this.testStartTime = performance.now();
        this.testData = [];
        this.testDuration = duration;
        
        // Update UI
        const startButton = document.getElementById('startTest');
        startButton.textContent = `🧪 Testing... (${duration/1000}s)`;
        startButton.disabled = true;
        
        this.showTestStatus(`Running ${duration/1000}s performance test...`, 'info');
        
        // End test after duration
        setTimeout(() => {
            this.endTest();
        }, duration);
        
        return true;
    }

    /**
     * Ends the current performance test
     */
    endTest() {
        if (!this.isTestRunning) return;
        
        this.isTestRunning = false;
        
        // Calculate test results
        const results = this.calculateTestResults();
        
        console.log(`✅ Test completed - Avg: ${results.avgFps.toFixed(1)}, Min: ${results.minFps}, Max: ${results.maxFps}`);
        
        // Update UI
        const startButton = document.getElementById('startTest');
        startButton.textContent = `🧪 Start Performance Test (${this.testDuration/1000}s)`;
        startButton.disabled = false;
        
        this.showTestStatus(
            `Test completed! Avg FPS: ${results.avgFps.toFixed(1)}, Min: ${results.minFps}, Max: ${results.maxFps}`,
            'success'
        );
        
        return results;
    }

    /**
     * Records current performance data for testing
     */
    recordTestData() {
        const currentTime = performance.now();
        const testElapsed = currentTime - this.testStartTime;
        
        this.testData.push({
            timestamp: currentTime,
            testTime: testElapsed,
            fps: this.fps,
            frameTime: this.frameTime,
            memoryUsage: this.getMemoryUsage()
        });
    }

    /**
     * Calculates test results from recorded data
     * @returns {Object} Test results summary
     */
    calculateTestResults() {
        if (this.testData.length === 0) {
            return {
                avgFps: 0,
                minFps: 0,
                maxFps: 0,
                avgFrameTime: 0,
                minFrameTime: 0,
                maxFrameTime: 0,
                avgMemory: 0,
                dataPoints: 0
            };
        }
        
        const fps = this.testData.map(d => d.fps);
        const frameTimes = this.testData.map(d => d.frameTime);
        const memory = this.testData.map(d => d.memoryUsage);
        
        return {
            avgFps: fps.reduce((sum, val) => sum + val, 0) / fps.length,
            minFps: Math.min(...fps),
            maxFps: Math.max(...fps),
            avgFrameTime: frameTimes.reduce((sum, val) => sum + val, 0) / frameTimes.length,
            minFrameTime: Math.min(...frameTimes),
            maxFrameTime: Math.max(...frameTimes),
            avgMemory: memory.reduce((sum, val) => sum + val, 0) / memory.length,
            dataPoints: this.testData.length
        };
    }

    /**
     * Exports test data as CSV
     * @param {string} filename - Optional filename
     */
    exportTestData(filename = `babylon-helix-test-${Date.now()}.csv`) {
        if (this.testData.length === 0) {
            this.showTestStatus('No test data to export', 'error');
            return false;
        }
        
        const results = this.calculateTestResults();
        
        // Create CSV content with metadata
        const headers = ['Timestamp', 'Test Time (ms)', 'FPS', 'Frame Time (ms)', 'Memory (MB)'];
        const rows = this.testData.map(row => [
            new Date(row.timestamp).toISOString(),
            row.testTime.toFixed(2),
            row.fps,
            row.frameTime.toFixed(2),
            row.memoryUsage
        ]);
        
        // Add test summary as comments
        const csvContent = [
            `# Babylon.js Helix Parallax Performance Test Results`,
            `# Generated: ${new Date().toISOString()}`,
            `# Test Duration: ${this.testDuration}ms`,
            `# Data Points: ${this.testData.length}`,
            `# Average FPS: ${results.avgFps.toFixed(2)}`,
            `# Min FPS: ${results.minFps}`,
            `# Max FPS: ${results.maxFps}`,
            `# Average Frame Time: ${results.avgFrameTime.toFixed(2)}ms`,
            `# Average Memory Usage: ${results.avgMemory.toFixed(2)}MB`,
            `#`,
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
        
        // Download CSV file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.showTestStatus('Test data exported successfully', 'success');
        console.log(`📊 Test data exported to ${filename}`);
        
        return true;
    }

    /**
     * Clears all test data
     */
    clearTestData() {
        this.testData = [];
        this.showTestStatus('Test data cleared', 'success');
        console.log('🗑️ Test data cleared');
    }

    /**
     * Shows test status message
     * @param {string} message - Status message
     * @param {string} type - Message type (info, success, error)
     */
    showTestStatus(message, type = 'info') {
        const statusElement = document.getElementById('test-status');
        statusElement.textContent = message;
        statusElement.style.display = message ? 'block' : 'none';
        
        // Remove existing classes
        statusElement.classList.remove('error', 'success', 'info');
        
        // Add appropriate class
        if (type) {
            statusElement.classList.add(type);
        }
        
        // Auto-hide after 5 seconds for success/error messages
        if (type !== 'info') {
            setTimeout(() => {
                if (statusElement.textContent === message) {
                    this.showTestStatus('', '');
                }
            }, 5000);
        }
    }

    /**
     * Updates geometry information display
     * @param {number} vertexCount - Number of vertices
     * @param {number} triangleCount - Number of triangles
     */
    updateGeometryInfo(vertexCount, triangleCount) {
        document.getElementById('vertices').textContent = vertexCount.toLocaleString();
        document.getElementById('triangles').textContent = triangleCount.toLocaleString();
    }

    /**
     * Gets current performance summary
     * @returns {Object} Performance summary
     */
    getPerformanceSummary() {
        return {
            fps: this.fps,
            frameTime: this.frameTime,
            memoryUsage: this.getMemoryUsage(),
            grade: this.getPerformanceGrade(this.fps),
            isTestRunning: this.isTestRunning,
            testDataPoints: this.testData.length
        };
    }
}

// Export for use in other modules
window.PerformanceMonitor = PerformanceMonitor;