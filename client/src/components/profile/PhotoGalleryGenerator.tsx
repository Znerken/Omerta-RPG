import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  AlertCircle, 
  Music, 
  Upload,
  Image,
  RefreshCw,
  CheckCircle2,
  X,
  Plus,
  Minus,
  User,
  Quote
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PhotoGalleryGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateTemplate: (htmlTemplate: string) => void;
  username: string;
}

export function PhotoGalleryGenerator({ 
  isOpen, 
  onClose, 
  onGenerateTemplate,
  username
}: PhotoGalleryGeneratorProps) {
  const { toast } = useToast();
  
  // State for form inputs
  const [albumCoverUrl, setAlbumCoverUrl] = useState('');
  const [songTitle, setSongTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [customQuote, setCustomQuote] = useState('');
  const [photoCount, setPhotoCount] = useState(6); // Default to 6 photos
  const [photoUrls, setPhotoUrls] = useState<string[]>(Array(10).fill(''));
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  // Name customization options
  const [displayName, setDisplayName] = useState('');
  const [selectedNameColor, setSelectedNameColor] = useState('gradient-gold');
  const [selectedNameEffect, setSelectedNameEffect] = useState('glow');

  // Update photo URLs array when photo count changes
  useEffect(() => {
    // Preserve existing URLs when changing count
    const newUrls = [...photoUrls];
    if (newUrls.length < photoCount) {
      // Add empty strings if we need more photos
      newUrls.push(...Array(photoCount - newUrls.length).fill(''));
    } else if (newUrls.length > photoCount) {
      // Remove extra photos if we need fewer
      newUrls.splice(photoCount);
    }
    setPhotoUrls(newUrls);
  }, [photoCount]);
  
  // Set display name default to username
  useEffect(() => {
    if (!displayName && username) {
      setDisplayName(username);
    }
  }, [displayName, username]);

  // Handle photo URL input change
  const handlePhotoUrlChange = (index: number, url: string) => {
    const newUrls = [...photoUrls];
    newUrls[index] = url;
    setPhotoUrls(newUrls);
  };

  // Add one more photo input field
  const addPhotoField = () => {
    if (photoCount < 20) { // Set a reasonable max limit
      setPhotoCount(photoCount + 1);
    }
  };

  // Remove the last photo input field
  const removePhotoField = () => {
    if (photoCount > 1) { // Always keep at least one photo
      setPhotoCount(photoCount - 1);
    }
  };

  // Check if form is valid
  const isFormValid = () => {
    return (
      albumCoverUrl.trim() !== '' &&
      songTitle.trim() !== '' &&
      artistName.trim() !== '' &&
      photoUrls.slice(0, photoCount).filter(url => url.trim() !== '').length === photoCount
    );
  };

  // Generate template
  const generateTemplate = () => {
    if (!isFormValid()) {
      toast({
        title: "Missing information",
        description: `Please fill all required fields and add ${photoCount} photos`,
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    // Simulate API call delay
    setTimeout(() => {
      // Only use the number of photos selected by the user
      const selectedPhotoUrls = photoUrls.slice(0, photoCount);
      
      // Define style properties based on name color selection
      let nameColorStyle = '';
      switch (selectedNameColor) {
        case 'gradient-gold':
          nameColorStyle = 'background: linear-gradient(90deg, #f9d423, #ff8a00); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;';
          break;
        case 'gradient-neon':
          nameColorStyle = 'background: linear-gradient(90deg, #00ff87, #60efff); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;';
          break;
        case 'gradient-fire':
          nameColorStyle = 'background: linear-gradient(90deg, #ff4e50, #f9d423); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;';
          break;
        case 'gradient-ocean':
          nameColorStyle = 'background: linear-gradient(90deg, #4facfe, #00f2fe); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;';
          break;
        case 'gradient-purple':
          nameColorStyle = 'background: linear-gradient(90deg, #8e2de2, #4a00e0); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;';
          break;
        case 'gradient-rainbow':
          nameColorStyle = 'background: linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;';
          break;
        case 'bloody':
          nameColorStyle = 'color: #ff0000;';
          break;
        default:
          nameColorStyle = 'color: #ffffff;';
      }
      
      // Define effect properties based on name effect selection
      let nameEffectStyle = '';
      switch (selectedNameEffect) {
        case 'glow':
          nameEffectStyle = 'text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);';
          break;
        case 'shadow':
          nameEffectStyle = 'text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);';
          break;
        case 'outline':
          nameEffectStyle = 'text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;';
          break;
        case 'blur':
          nameEffectStyle = 'filter: blur(0.5px);';
          break;
        case 'retro':
          nameEffectStyle = 'font-family: monospace; letter-spacing: 2px;';
          break;
        default:
          nameEffectStyle = '';
      }
      
      // Use the actual display name if provided, otherwise fall back to username
      const nameToDisplay = displayName || username;
      
      const htmlTemplate = `
<div style="font-family: 'Inter', sans-serif; background-color: #121212; color: #ffffff; padding: 20px; border-radius: 10px; max-width: 800px; margin: 0 auto;">
  <!-- Custom Name Title -->
  <div style="text-align: center; margin-bottom: 25px;">
    <h1 style="font-size: 2.2rem; font-weight: 900; ${nameColorStyle} ${nameEffectStyle} margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 1px;">
      ${nameToDisplay}
    </h1>
  </div>

  <!-- Album Header Section -->
  <div style="margin-bottom: 25px; position: relative; overflow: hidden; border-radius: 12px;">
    <!-- Album cover and title -->
    <div style="display: flex; align-items: center; background-color: #1f1e1c; padding: 20px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);">
      <!-- Album artwork -->
      <div style="width: 120px; height: 120px; border-radius: 8px; overflow: hidden; margin-right: 20px; flex-shrink: 0; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);">
        <img src="${albumCoverUrl}" 
             style="width: 100%; height: 100%; object-fit: cover;" alt="${songTitle}">
      </div>
      
      <!-- Album info -->
      <div>
        <h2 style="font-size: 1.8rem; margin: 0 0 5px 0; font-weight: 800; letter-spacing: 0.5px; background: linear-gradient(90deg, #f9d423, #ff4e50); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;">${songTitle}</h2>
        <p style="margin: 0 0 2px 0; font-size: 1rem; opacity: 0.8;">${artistName}</p>
        
        <!-- Audio player simulation -->
        <div style="margin-top: 15px; display: flex; align-items: center;">
          <div style="width: 220px; height: 4px; background-color: #333; border-radius: 2px; position: relative; margin-right: 10px;">
            <div style="position: absolute; left: 0; top: 0; width: 60%; height: 100%; background: linear-gradient(90deg, #f9d423, #ff4e50); border-radius: 2px;"></div>
            <div style="position: absolute; left: 60%; top: 50%; transform: translate(-50%, -50%); width: 12px; height: 12px; background-color: #fff; border-radius: 50%;"></div>
          </div>
          <span style="font-size: 0.8rem; opacity: 0.6;">2:35 / 4:58</span>
        </div>
        
        <!-- Audio controls -->
        <div style="display: flex; align-items: center; margin-top: 12px; gap: 15px;">
          <div style="width: 30px; height: 30px; border-radius: 50%; background-color: #ff4e50; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 0 10px rgba(255, 78, 80, 0.4);">
            <div style="width: 10px; height: 10px; background-color: #fff; clip-path: polygon(0 0, 0 100%, 100% 50%);"></div>
          </div>
          <div style="width: 10px; height: 10px; border-radius: 50%; background-color: #fff;"></div>
          <div style="width: 10px; height: 10px; border-radius: 50%; background-color: #333;"></div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Image Grid Gallery -->
  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px;">
    ${selectedPhotoUrls.map((url, index) => `
    <div style="border-radius: 8px; overflow: hidden; aspect-ratio: 1/1; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);">
      <img src="${url}" style="width: 100%; height: 100%; object-fit: cover;" alt="Gallery Image ${index + 1}">
    </div>
    `).join('')}
  </div>
  
  <!-- Footer with custom styling -->
  <div style="padding: 20px; text-align: center; margin-top: 15px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
    <div style="opacity: 0.5; font-size: 0.8em; letter-spacing: 1px; text-transform: uppercase;">
      "${songTitle}" • OMERTÀ • ESTABLISHED 2025
    </div>
    <div style="margin-top: 8px; opacity: 0.3; font-size: 0.7em;">
      ${customQuote || nameToDisplay.toUpperCase()}
    </div>
  </div>
</div>
      `;

      setIsGenerating(false);
      onGenerateTemplate(htmlTemplate);

      toast({
        title: "Template generated!",
        description: "Your custom photo gallery profile has been created.",
      });
    }, 1500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Image className="mr-2 h-5 w-5" /> 
            Photo Gallery Profile Generator
          </DialogTitle>
          <DialogDescription>
            Create a customized photo gallery profile with your own images and music
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 py-4">
          {isPreviewMode ? (
            <div className="mb-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Preview</CardTitle>
                  <CardDescription>
                    This is how your photo gallery will look
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-black p-4 rounded-md">
                    {/* Album Header Preview */}
                    <div className="flex items-center bg-zinc-900 p-4 rounded-lg mb-4">
                      {albumCoverUrl ? (
                        <img 
                          src={albumCoverUrl} 
                          alt="Album Cover" 
                          className="w-20 h-20 object-cover rounded mr-4 border border-zinc-700"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-zinc-800 rounded mr-4 flex items-center justify-center">
                          <Music className="w-8 h-8 text-zinc-600" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-bold bg-gradient-to-r from-yellow-400 to-red-500 bg-clip-text text-transparent">
                          {songTitle || "Song Title"}
                        </h3>
                        <p className="text-zinc-400 text-sm">
                          {artistName || "Artist Name"}
                        </p>
                        <div className="mt-2 w-40 h-1 bg-zinc-700 rounded-full relative">
                          <div className="absolute h-full w-3/5 bg-gradient-to-r from-yellow-400 to-red-500 rounded-full"></div>
                        </div>
                      </div>
                    </div>

                    {/* Photo Grid Preview */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {photoUrls.slice(0, photoCount).map((url, index) => (
                        <div 
                          key={index} 
                          className="aspect-square bg-zinc-800 rounded overflow-hidden relative"
                        >
                          {url ? (
                            <img 
                              src={url} 
                              alt={`Gallery image ${index + 1}`} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Image className="w-6 h-6 text-zinc-600" />
                            </div>
                          )}
                          <div className="absolute top-1 right-1 bg-black/50 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer Preview */}
                    <div className="border-t border-zinc-800 pt-3 text-center">
                      <p className="text-xs text-zinc-500 uppercase tracking-wider">
                        "{songTitle || "Song Title"}" • OMERTÀ • 2025
                      </p>
                      <p className="text-xs text-zinc-700 mt-1">
                        {customQuote || username.toUpperCase()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              {/* Album Cover Section */}
              <div className="space-y-2">
                <Label htmlFor="album-cover" className="text-sm font-medium flex items-center">
                  <Music className="w-4 h-4 mr-1" /> Album Cover Image
                </Label>
                <Input
                  id="album-cover"
                  placeholder="Enter album cover image URL"
                  value={albumCoverUrl}
                  onChange={(e) => setAlbumCoverUrl(e.target.value)}
                />
              </div>

              {/* Song & Artist Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="song-title" className="text-sm font-medium">
                    Song Title
                  </Label>
                  <Input
                    id="song-title"
                    placeholder="e.g. Happier Than Ever"
                    value={songTitle}
                    onChange={(e) => setSongTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="artist-name" className="text-sm font-medium">
                    Artist Name
                  </Label>
                  <Input
                    id="artist-name"
                    placeholder="e.g. Billie Eilish"
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                  />
                </div>
              </div>

              {/* Photo Count Control */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center">
                    <Image className="w-4 h-4 mr-1" /> Photo Gallery (<span className="font-bold text-primary">{photoCount}</span> Images)
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 w-8 p-0" 
                      onClick={removePhotoField}
                      disabled={photoCount <= 1}
                    >
                      <span className="sr-only">Remove photo</span>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium w-8 text-center">{photoCount}</span>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 w-8 p-0" 
                      onClick={addPhotoField}
                      disabled={photoCount >= 20}
                    >
                      <span className="sr-only">Add photo</span>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {Array.from({ length: photoCount }).map((_, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-8 h-8 flex items-center justify-center rounded bg-muted">
                        {index + 1}
                      </div>
                      <Input
                        placeholder={`Photo ${index + 1} URL`}
                        value={photoUrls[index]}
                        onChange={(e) => handlePhotoUrlChange(index, e.target.value)}
                        className="flex-1"
                      />
                      <div className="w-6 text-center">
                        {photoUrls[index] ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Display Name Customization */}
              <div className="space-y-4 p-4 border border-border rounded-lg bg-card/50">
                <div className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  <h3 className="text-base font-semibold">Customize Your Name Display</h3>
                </div>
                
                {/* Name Input */}
                <div className="space-y-2">
                  <Label htmlFor="display-name" className="text-sm font-medium">
                    Display Name
                  </Label>
                  <Input
                    id="display-name"
                    placeholder="Your display name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
                
                {/* Name Color Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Name Color Style
                  </Label>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedNameColor('gradient-gold')}
                      className={`p-2 rounded-md text-center ${selectedNameColor === 'gradient-gold' ? 'ring-2 ring-primary' : 'border border-border'}`}
                    >
                      <span className="block text-sm font-semibold bg-gradient-to-r from-yellow-300 to-amber-600 bg-clip-text text-transparent">
                        Gold
                      </span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setSelectedNameColor('gradient-neon')}
                      className={`p-2 rounded-md text-center ${selectedNameColor === 'gradient-neon' ? 'ring-2 ring-primary' : 'border border-border'}`}
                    >
                      <span className="block text-sm font-semibold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                        Neon
                      </span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setSelectedNameColor('gradient-fire')}
                      className={`p-2 rounded-md text-center ${selectedNameColor === 'gradient-fire' ? 'ring-2 ring-primary' : 'border border-border'}`}
                    >
                      <span className="block text-sm font-semibold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
                        Fire
                      </span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setSelectedNameColor('gradient-ocean')}
                      className={`p-2 rounded-md text-center ${selectedNameColor === 'gradient-ocean' ? 'ring-2 ring-primary' : 'border border-border'}`}
                    >
                      <span className="block text-sm font-semibold bg-gradient-to-r from-blue-400 to-indigo-600 bg-clip-text text-transparent">
                        Ocean
                      </span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setSelectedNameColor('gradient-purple')}
                      className={`p-2 rounded-md text-center ${selectedNameColor === 'gradient-purple' ? 'ring-2 ring-primary' : 'border border-border'}`}
                    >
                      <span className="block text-sm font-semibold bg-gradient-to-r from-purple-500 to-violet-600 bg-clip-text text-transparent">
                        Royal
                      </span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setSelectedNameColor('gradient-rainbow')}
                      className={`p-2 rounded-md text-center ${selectedNameColor === 'gradient-rainbow' ? 'ring-2 ring-primary' : 'border border-border'}`}
                    >
                      <span className="block text-sm font-semibold bg-gradient-to-r from-red-500 via-green-500 to-blue-500 bg-clip-text text-transparent">
                        Rainbow
                      </span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setSelectedNameColor('bloody')}
                      className={`p-2 rounded-md text-center ${selectedNameColor === 'bloody' ? 'ring-2 ring-primary' : 'border border-border'}`}
                    >
                      <span className="block text-sm font-semibold text-red-600">
                        Bloody
                      </span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setSelectedNameColor('white')}
                      className={`p-2 rounded-md text-center ${selectedNameColor === 'white' ? 'ring-2 ring-primary' : 'border border-border'}`}
                    >
                      <span className="block text-sm font-semibold text-white">
                        Classic
                      </span>
                    </button>
                  </div>
                </div>
                
                {/* Name Effect Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Name Effect
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedNameEffect('glow')}
                      className={`p-2 rounded-md text-center ${selectedNameEffect === 'glow' ? 'ring-2 ring-primary' : 'border border-border'}`}
                    >
                      <span className="block text-sm font-semibold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">
                        Glow
                      </span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setSelectedNameEffect('shadow')}
                      className={`p-2 rounded-md text-center ${selectedNameEffect === 'shadow' ? 'ring-2 ring-primary' : 'border border-border'}`}
                    >
                      <span className="block text-sm font-semibold text-white drop-shadow-[2px_2px_2px_rgba(0,0,0,0.8)]">
                        Shadow
                      </span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setSelectedNameEffect('outline')}
                      className={`p-2 rounded-md text-center ${selectedNameEffect === 'outline' ? 'ring-2 ring-primary' : 'border border-border'}`}
                    >
                      <span className="block text-sm font-semibold text-white" style={{ textShadow: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000" }}>
                        Outline
                      </span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setSelectedNameEffect('blur')}
                      className={`p-2 rounded-md text-center ${selectedNameEffect === 'blur' ? 'ring-2 ring-primary' : 'border border-border'}`}
                    >
                      <span className="block text-sm font-semibold text-white blur-[0.5px]">
                        Blur
                      </span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setSelectedNameEffect('retro')}
                      className={`p-2 rounded-md text-center ${selectedNameEffect === 'retro' ? 'ring-2 ring-primary' : 'border border-border'}`}
                    >
                      <span className="block text-sm font-semibold text-white" style={{ fontFamily: 'monospace', letterSpacing: '1px' }}>
                        Retro
                      </span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setSelectedNameEffect('none')}
                      className={`p-2 rounded-md text-center ${selectedNameEffect === 'none' ? 'ring-2 ring-primary' : 'border border-border'}`}
                    >
                      <span className="block text-sm font-semibold text-muted-foreground">
                        None
                      </span>
                    </button>
                  </div>
                  
                  {/* Name Preview */}
                  <div className="mt-4 p-4 bg-black/50 rounded-md flex justify-center items-center">
                    <h3 className={`text-xl font-bold 
                      ${selectedNameColor === 'gradient-gold' ? 'bg-gradient-to-r from-yellow-300 to-amber-600 bg-clip-text text-transparent' : ''}
                      ${selectedNameColor === 'gradient-neon' ? 'bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent' : ''}
                      ${selectedNameColor === 'gradient-fire' ? 'bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent' : ''}
                      ${selectedNameColor === 'gradient-ocean' ? 'bg-gradient-to-r from-blue-400 to-indigo-600 bg-clip-text text-transparent' : ''}
                      ${selectedNameColor === 'gradient-purple' ? 'bg-gradient-to-r from-purple-500 to-violet-600 bg-clip-text text-transparent' : ''}
                      ${selectedNameColor === 'gradient-rainbow' ? 'bg-gradient-to-r from-red-500 via-green-500 to-blue-500 bg-clip-text text-transparent' : ''}
                      ${selectedNameColor === 'bloody' ? 'text-red-600' : ''}
                      ${selectedNameColor === 'white' ? 'text-white' : ''}
                      ${selectedNameEffect === 'glow' ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : ''}
                      ${selectedNameEffect === 'shadow' ? 'drop-shadow-[2px_2px_2px_rgba(0,0,0,0.8)]' : ''}
                      ${selectedNameEffect === 'blur' ? 'blur-[0.5px]' : ''}
                      ${selectedNameEffect === 'retro' ? 'font-mono tracking-widest' : ''}
                    `}
                    style={{
                      ...(selectedNameEffect === 'outline' ? { textShadow: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000" } : {})
                    }}
                    >
                      {displayName || username || "YOUR NAME"}
                    </h3>
                  </div>
                </div>
              </div>
            
              {/* Custom Quote */}
              <div className="space-y-2">
                <Label htmlFor="custom-quote" className="text-sm font-medium">
                  Custom Quote or Message (optional)
                </Label>
                <Textarea
                  id="custom-quote"
                  placeholder="Add a custom quote or message for the footer"
                  value={customQuote}
                  onChange={(e) => setCustomQuote(e.target.value)}
                  rows={2}
                />
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span className="text-xs text-muted-foreground">
              {isFormValid()
                ? "Ready to generate your template"
                : `Please fill all fields and add ${photoCount} photos`}
            </span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsPreviewMode(!isPreviewMode)}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            {isPreviewMode ? "Edit" : "Preview"}
          </Button>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={generateTemplate} 
            disabled={isGenerating || !isFormValid()}
            className="ml-2"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Template"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}