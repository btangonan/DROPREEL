import { useState, useEffect } from 'react';
import { VideoThumbnail } from './components/VideoThumbnail';
import { VideoPreviewModal } from './components/VideoPreviewModal';
import { DropZone } from './components/DropZone';
import { TitleDropdown } from './components/TitleDropdown';
import { Button } from './components/ui/button';
import { Terminal, Database, Wifi, Plus, FileText, Palette, Zap, User, Clock, LogIn, Sun, Moon } from 'lucide-react';

interface Video {
  id: string;
  thumbnail: string;
  title: string;
  duration: string;
  videoSrc: string;
}

interface TitleElement {
  id: string;
  text: string;
  size: string;
  timestamp: number;
}

const mockVideos: Video[] = [
  {
    id: '1',
    thumbnail: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=400&h=225&fit=crop&auto=format',
    title: 'Urban Sunset',
    duration: '2:15',
    videoSrc: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
  },
  {
    id: '2',
    thumbnail: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=225&fit=crop&auto=format',
    title: 'Creative Studio',
    duration: '1:45',
    videoSrc: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4'
  },
  {
    id: '3',
    thumbnail: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=225&fit=crop&auto=format',
    title: 'Modern Interior',
    duration: '3:20',
    videoSrc: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
  },
  {
    id: '4',
    thumbnail: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=225&fit=crop&auto=format',
    title: 'Tech Workspace',
    duration: '1:30',
    videoSrc: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4'
  },
  {
    id: '5',
    thumbnail: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=225&fit=crop&auto=format',
    title: 'Office Space',
    duration: '2:45',
    videoSrc: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
  },
  {
    id: '6',
    thumbnail: 'https://images.unsplash.com/photo-1497366412874-3415097a27e7?w=400&h=225&fit=crop&auto=format',
    title: 'Business Meeting',
    duration: '4:10',
    videoSrc: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4'
  },
  {
    id: '7',
    thumbnail: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=225&fit=crop&auto=format',
    title: 'Team Collaboration',
    duration: '3:45',
    videoSrc: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
  },
  {
    id: '8',
    thumbnail: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=225&fit=crop&auto=format',
    title: 'Corporate Culture',
    duration: '2:30',
    videoSrc: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4'
  },
  {
    id: '9',
    thumbnail: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=225&fit=crop&auto=format',
    title: 'Startup Energy',
    duration: '1:55',
    videoSrc: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
  },
  {
    id: '10',
    thumbnail: 'https://images.unsplash.com/photo-1553028826-f4804a6dba3b?w=400&h=225&fit=crop&auto=format',
    title: 'Innovation Hub',
    duration: '3:10',
    videoSrc: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4'
  },
  {
    id: '11',
    thumbnail: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400&h=225&fit=crop&auto=format',
    title: 'Conference Room',
    duration: '2:20',
    videoSrc: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
  },
  {
    id: '12',
    thumbnail: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=225&fit=crop&auto=format',
    title: 'Professional Portrait',
    duration: '1:40',
    videoSrc: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4'
  },
  {
    id: '13',
    thumbnail: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=225&fit=crop&auto=format',
    title: 'Remote Work',
    duration: '2:55',
    videoSrc: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
  },
  {
    id: '14',
    thumbnail: 'https://images.unsplash.com/photo-1664575602554-2087b04935a5?w=400&h=225&fit=crop&auto=format',
    title: 'Digital Strategy',
    duration: '3:35',
    videoSrc: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4'
  },
  {
    id: '15',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-a55f9b30f8df?w=400&h=225&fit=crop&auto=format',
    title: 'Product Launch',
    duration: '4:20',
    videoSrc: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
  },
  {
    id: '16',
    thumbnail: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=225&fit=crop&auto=format',
    title: 'Brand Workshop',
    duration: '2:05',
    videoSrc: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4'
  },
  {
    id: '17',
    thumbnail: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=225&fit=crop&auto=format',
    title: 'Tech Demo',
    duration: '3:25',
    videoSrc: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
  },
  {
    id: '18',
    thumbnail: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400&h=225&fit=crop&auto=format',
    title: 'Design Process',
    duration: '2:40',
    videoSrc: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4'
  }
];

export default function App() {
  const [selectedVideos, setSelectedVideos] = useState<Video[]>([]);
  const [previewVideo, setPreviewVideo] = useState<Video | null>(null);
  const [titles, setTitles] = useState<TitleElement[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const handleVideoClick = (video: Video) => {
    setPreviewVideo(video);
  };

  const handleDrop = (videoId: string) => {
    const video = mockVideos.find(v => v.id === videoId);
    if (video && !selectedVideos.find(v => v.id === videoId)) {
      setSelectedVideos([...selectedVideos, video]);
    }
  };

  const handleRemoveVideo = (videoId: string) => {
    setSelectedVideos(selectedVideos.filter(v => v.id !== videoId));
  };

  const handleDragStart = (e: React.DragEvent, videoId: string) => {
    e.dataTransfer.setData('text/plain', videoId);
  };

  const handleAddTitle = (text: string, size: string) => {
    const newTitle: TitleElement = {
      id: Date.now().toString(),
      text: text.toUpperCase(),
      size,
      timestamp: Date.now()
    };
    setTitles([...titles, newTitle]);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-mono">
      {/* Header */}
      <div className="border-b-2 border-archive-primary bg-background p-6">
        {/* Top bar with logo, theme toggle, and login */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl text-archive-primary">DROPREEL</h1>
            <div className="text-xs text-archive-secondary font-mono mt-1">
              DROP IN. CUT FAST. LOOK GOOD.
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="brutal-button px-4 py-2 flex items-center gap-2"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span>{isDarkMode ? 'LIGHT' : 'DARK'}</span>
            </button>
            <button className="brutal-button px-6 py-2 flex items-center gap-2">
              <LogIn className="w-4 h-4" />
              <span>LOGIN</span>
            </button>
          </div>
        </div>
        
        {/* Button Grid */}
        <div className="grid grid-cols-5 gap-4">
          <button className="brutal-button px-4 py-3 flex items-center gap-2">
            <Wifi className="w-4 h-4" />
            <span>CONNECTED</span>
          </button>
          <button className="brutal-button px-4 py-3 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>ADD_VIDEOS</span>
          </button>
          <div className="relative">
            <TitleDropdown onAddTitle={handleAddTitle} />
          </div>
          <button className="brutal-button px-4 py-3 flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span>THEME_MENU</span>
          </button>
          <button className="brutal-button-accent px-4 py-3 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span>MAKE_REEL</span>
          </button>
        </div>

        {/* Titles Display */}
        {titles.length > 0 && (
          <div className="mt-4 border-t border-archive-primary pt-4">
            <div className="text-xs text-archive-primary mb-2">ADDED TITLES:</div>
            <div className="flex flex-wrap gap-2">
              {titles.map((title) => (
                <div
                  key={title.id}
                  className="bg-archive-light-gray border border-archive-primary px-2 py-1 text-xs text-archive-primary flex items-center gap-2"
                >
                  <span>{title.text}</span>
                  <span className="text-archive-secondary">({title.size})</span>
                  <button
                    onClick={() => setTitles(titles.filter(t => t.id !== title.id))}
                    className="text-archive-danger hover:text-archive-secondary transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Interface */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Video Archive */}
          <div className="flex flex-col bg-background border-2 border-archive-primary" style={{ height: '500px' }}>
            {/* Header */}
            <div className="bg-archive-primary text-background px-4 py-2 flex items-center gap-2 flex-shrink-0">
              <Database className="w-4 h-4" />
              <span className="text-sm font-mono">YOUR VIDEOS</span>
              <div className="ml-auto flex items-center gap-2">
                <div className="text-xs">
                  {mockVideos.length} FILES
                </div>
              </div>
            </div>
            
            {/* Video content with scroll */}
            <div className="flex-1 p-4 overflow-hidden">
              <div className="grid grid-cols-3 gap-3 h-full overflow-y-auto">
                {mockVideos.map((video) => (
                  <VideoThumbnail
                    key={video.id}
                    {...video}
                    onClick={() => handleVideoClick(video)}
                    onDragStart={(e) => handleDragStart(e, video.id)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Reel Constructor */}
          <div>
            <DropZone
              selectedVideos={selectedVideos}
              onVideoClick={handleVideoClick}
              onDrop={handleDrop}
              onRemoveVideo={handleRemoveVideo}
            />
          </div>
        </div>
      </div>

      {/* Video Preview Modal */}
      <VideoPreviewModal
        isOpen={!!previewVideo}
        onClose={() => setPreviewVideo(null)}
        videoSrc={previewVideo?.videoSrc || ''}
        title={previewVideo?.title || ''}
      />
    </div>
  );
}