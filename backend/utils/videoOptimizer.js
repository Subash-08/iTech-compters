// backend/utils/videoOptimizer.js
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

class VideoOptimizer {
    constructor() {
        this.supportedFormats = ['mp4', 'webm'];
        this.presets = {
            low: { size: '640x360', bitrate: '500k' },
            medium: { size: '1280x720', bitrate: '1500k' },
            high: { size: '1920x1080', bitrate: '4000k' }
        };
    }

    async optimizeVideo(inputPath, outputPath, quality = 'medium') {
        return new Promise((resolve, reject) => {
            const preset = this.presets[quality] || this.presets.medium;

            ffmpeg(inputPath)
                .output(outputPath)
                .videoCodec('libx264')
                .size(preset.size)
                .videoBitrate(preset.bitrate)
                .audioCodec('aac')
                .audioBitrate('128k')
                .fps(30)
                .on('progress', (progress) => {
                })
                .on('end', () => {
                    resolve(outputPath);
                })
                .on('error', (err) => {
                    console.error('Error optimizing video:', err);
                    reject(err);
                })
                .run();
        });
    }

    async getVideoMetadata(filePath) {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(filePath, (err, metadata) => {
                if (err) return reject(err);

                const videoStream = metadata.streams.find(s => s.codec_type === 'video');
                const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

                resolve({
                    duration: parseFloat(metadata.format.duration),
                    size: parseInt(metadata.format.size),
                    format: metadata.format.format_name,
                    resolution: {
                        width: videoStream?.width || 0,
                        height: videoStream?.height || 0
                    },
                    bitrate: parseInt(metadata.format.bit_rate) || 0,
                    codec: videoStream?.codec_name || 'unknown',
                    hasAudio: !!audioStream
                });
            });
        });
    }

    async generateThumbnail(videoPath, outputPath, time = '00:00:01') {
        return new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .screenshots({
                    timestamps: [time],
                    filename: path.basename(outputPath),
                    folder: path.dirname(outputPath),
                    size: '320x180'
                })
                .on('end', () => {
                    resolve(outputPath);
                })
                .on('error', (err) => {
                    reject(err);
                });
        });
    }

    async convertToWebM(inputPath, outputPath) {
        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .output(outputPath)
                .videoCodec('libvpx-vp9')
                .audioCodec('libopus')
                .on('end', () => resolve(outputPath))
                .on('error', reject)
                .run();
        });
    }

    async cleanupFile(filePath) {
        return new Promise((resolve) => {
            if (fs.existsSync(filePath)) {
                fs.unlink(filePath, (err) => {
                    if (err) console.error('Error deleting file:', err);
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
}

module.exports = new VideoOptimizer();