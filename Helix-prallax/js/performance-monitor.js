// Chapter 7 - Performance Monitor
// Tracks FPS, frame times, memory usage, and exports data for analysis

export class PerformanceMonitor {
    constructor() {
        this.isRunning = false;
        this.isTestRunning = false;
        
        // Performance tracking
        this.frameCount = 0;
        this.startTime = 0;
        this.lastTime = 0;
        this.currentTime = 0;
        
        // FPS tracking
        this.fps = 0;
        this.frameTime = 0;
        this.fpsHistory = [];
        this.frameTimeHistory = [];
        
        // Memory tracking
        this.memoryUsage = 0;
        this.memoryHistory = [];
        
        // Test data
        this.testData = [];
        this.testStartTime = 0;
        this.testDuration = 0;
        
        // Configuration
        this.maxHistoryLength = 300; // 5 minutes at 60fps
        this.updateInterval = 1000; // Update every second
        
        this.lastUpdateTime = 0;
    }
    
    /**
     * Start performance monitoring
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.startTime = performance.now();
        this.lastTime = this.startTime;
        this.lastUpdateTime = this.startTime;
        this.frameCount = 0;
        
        console.log('📊 Performance monitoring started');
    }
    
    /**
     * Stop performance monitoring
     */
    stop() {
        this.isRunning = false;
        console.log('📊 Performance monitoring stopped');
    }
    
    /**
     * Pause performance monitoring
     */
    pause() {
        this.isRunning = false;
    }
    
    /**
     * Begin frame measurement
     */
    beginFrame() {
        if (!this.isRunning) return;
        
        this.currentTime = performance.now();
        this.frameTime = this.currentTime - this.lastTime;
        this.frameCount++;
    }
    
    /**
     * End frame measurement and return current metrics
     */
    endFrame() {
        if (!this.isRunning) return null;
        
        // Update FPS every second
        if (this.currentTime - this.lastUpdateTime >= this.updateInterval) {
            this.updateFPS();
            this.updateMemoryUsage();
            this.updateHistory();
            
            if (this.isTestRunning) {
                this.recordTestData();
            }
            
            this.lastUpdateTime = this.currentTime;
        }
        
        this.lastTime = this.currentTime;
        
        return this.getCurrentMetrics();
    }
    
    /**
     * Update FPS calculation
     */
    updateFPS() {
        const timeElapsed = this.currentTime - this.lastUpdateTime;
        const framesInPeriod = this.frameCount - (this.lastFrameCount || 0);
        
        this.fps = Math.round((framesInPeriod / timeElapsed) * 1000);
        this.lastFrameCount = this.frameCount;
    }
    
    /**
     * Update memory usage
     */
    updateMemoryUsage() {
        if (window.performance && window.performance.memory) {
            this.memoryUsage = Math.round(window.performance.memory.usedJSHeapSize / 1024 / 1024);
        } else {
            this.memoryUsage = 0;
        }
    }
    
    /**
     * Update history arrays
     */
    updateHistory() {
        // Add current values to history
        this.fpsHistory.push(this.fps);
        this.frameTimeHistory.push(this.frameTime);
        this.memoryHistory.push(this.memoryUsage);
        
        // Trim history to max length
        if (this.fpsHistory.length > this.maxHistoryLength) {
            this.fpsHistory.shift();
            this.frameTimeHistory.shift();
            this.memoryHistory.shift();
        }
    }
    
    /**
     * Get current performance metrics
     */
    getCurrentMetrics() {
        return {
            fps: this.fps,
            frameTime: Math.round(this.frameTime * 100) / 100,
            frameCount: this.frameCount,
            memoryUsage: this.memoryUsage,
            uptime: Math.round((this.currentTime - this.startTime) / 1000),
            
            // Statistics
            avgFps: this.calculateAverage(this.fpsHistory),
            minFps: this.fpsHistory.length > 0 ? Math.min(...this.fpsHistory) : 0,
            maxFps: this.fpsHistory.length > 0 ? Math.max(...this.fpsHistory) : 0,
            
            avgFrameTime: this.calculateAverage(this.frameTimeHistory),
            minFrameTime: this.frameTimeHistory.length > 0 ? Math.min(...this.frameTimeHistory) : 0,
            maxFrameTime: this.frameTimeHistory.length > 0 ? Math.max(...this.frameTimeHistory) : 0
        };
    }
    
    /**
     * Start a performance test
     */
    startTest(duration = 30000) {
        return new Promise((resolve) => {
            if (this.isTestRunning) {
                console.warn('⚠️ Test already running');
                return resolve(null);
            }
            
            console.log(`🧪 Starting ${duration/1000}s performance test...`);
            
            this.isTestRunning = true;
            this.testStartTime = performance.now();
            this.testDuration = duration;
            this.testData = [];
            
            // End test after duration
            setTimeout(() => {
                this.endTest();
                resolve(this.getTestResults());
            }, duration);
        });
    }
    
    /**
     * End current test
     */
    endTest() {
        if (!this.isTestRunning) return;
        
        this.isTestRunning = false;
        
        console.log('✅ Performance test completed');
        console.log(`📊 Test Results:`, this.getTestResults());
    }
    
    /**
     * Record test data point
     */
    recordTestData() {
        if (!this.isTestRunning) return;
        
        const currentMetrics = this.getCurrentMetrics();
        const testElapsed = this.currentTime - this.testStartTime;
        
        this.testData.push({
            timestamp: this.currentTime,
            testTime: testElapsed,
            fps: currentMetrics.fps,
            frameTime: currentMetrics.frameTime,
            memoryUsage: currentMetrics.memoryUsage
        });
    }
    
    /**
     * Get test results with statistics
     */
    getTestResults() {
        if (this.testData.length === 0) {
            return null;
        }
        
        const fpsValues = this.testData.map(d => d.fps).filter(v => v > 0);
        const frameTimeValues = this.testData.map(d => d.frameTime).filter(v => v > 0);
        const memoryValues = this.testData.map(d => d.memoryUsage);
        
        return {
            duration: this.testDuration,
            dataPoints: this.testData.length,
            
            fps: {
                avg: this.calculateAverage(fpsValues),
                min: Math.min(...fpsValues),
                max: Math.max(...fpsValues),
                median: this.calculateMedian(fpsValues),
                stdDev: this.calculateStandardDeviation(fpsValues),
                values: fpsValues
            },
            
            frameTime: {
                avg: this.calculateAverage(frameTimeValues),
                min: Math.min(...frameTimeValues),
                max: Math.max(...frameTimeValues),
                median: this.calculateMedian(frameTimeValues),
                stdDev: this.calculateStandardDeviation(frameTimeValues),
                values: frameTimeValues
            },
            
            memory: {
                avg: this.calculateAverage(memoryValues),
                min: Math.min(...memoryValues),
                max: Math.max(...memoryValues),
                median: this.calculateMedian(memoryValues),
                stdDev: this.calculateStandardDeviation(memoryValues),
                values: memoryValues
            },
            
            rawData: this.testData
        };
    }
    
    /**
     * Export all data as CSV
     */
    exportData() {
        if (this.testData.length === 0) {
            console.warn('⚠️ No test data to export');
            return;
        }
        
        const results = this.getTestResults();
        const timestamp = new Date().toISOString();
        
        // Create CSV content
        const headers = [
            'Timestamp',
            'Test Time (ms)',
            'FPS',
            'Frame Time (ms)',
            'Memory Usage (MB)'
        ];
        
        const rows = this.testData.map(row => [
            new Date(row.timestamp).toISOString(),
            row.testTime.toFixed(2),
            row.fps,
            row.frameTime.toFixed(2),
            row.memoryUsage
        ]);
        
        const csvContent = [
            `# Performance Test Results - ${timestamp}`,
            `# Duration: ${results.duration}ms, Data Points: ${results.dataPoints}`,
            `# FPS - Avg: ${results.fps.avg.toFixed(2)}, Min: ${results.fps.min}, Max: ${results.fps.max}`,
            `# Frame Time - Avg: ${results.frameTime.avg.toFixed(2)}ms, Min: ${results.frameTime.min.toFixed(2)}ms, Max: ${results.frameTime.max.toFixed(2)}ms`,
            `# Memory - Avg: ${results.memory.avg.toFixed(2)}MB, Min: ${results.memory.min}MB, Max: ${results.memory.max}MB`,
            '',
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
        
        // Download CSV
        this.downloadCSV(csvContent, `performance-test-${Date.now()}.csv`);
        
        console.log('📁 Performance data exported');
        return csvContent;
    }
    
    /**
     * Download CSV file
     */
    downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
        }
    }
    
    /**
     * Clear all test data
     */
    clearData() {
        this.testData = [];
        this.fpsHistory = [];
        this.frameTimeHistory = [];
        this.memoryHistory = [];
        
        console.log('🧹 Performance data cleared');
    }
    
    /**
     * Calculate average of array
     */
    calculateAverage(values) {
        if (values.length === 0) return 0;
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }
    
    /**
     * Calculate median of array
     */
    calculateMedian(values) {
        if (values.length === 0) return 0;
        
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        
        return sorted.length % 2 !== 0 
            ? sorted[mid] 
            : (sorted[mid - 1] + sorted[mid]) / 2;
    }
    
    /**
     * Calculate standard deviation of array
     */
    calculateStandardDeviation(values) {
        if (values.length === 0) return 0;
        
        const avg = this.calculateAverage(values);
        const squaredDiffs = values.map(val => Math.pow(val - avg, 2));
        const avgSquaredDiff = this.calculateAverage(squaredDiffs);
        
        return Math.sqrt(avgSquaredDiff);
    }
    
    /**
     * Get performance grade based on FPS
     */
    getPerformanceGrade(fps) {
        if (fps >= 55) return { grade: 'A', color: '#4CAF50', description: 'Excellent' };
        if (fps >= 45) return { grade: 'B', color: '#8BC34A', description: 'Good' };
        if (fps >= 30) return { grade: 'C', color: '#FFC107', description: 'Fair' };
        if (fps >= 20) return { grade: 'D', color: '#FF9800', description: 'Poor' };
        return { grade: 'F', color: '#F44336', description: 'Unplayable' };
    }
    
    /**
     * Dispose of performance monitor
     */
    dispose() {
        this.stop();
        this.clearData();
        
        console.log('🧹 Performance monitor disposed');
    }
}