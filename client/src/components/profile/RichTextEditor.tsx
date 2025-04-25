import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Image as ImageIcon,
  Link as LinkIcon,
  Type,
  Code,
  Heading1,
  Heading2,
  Heading3,
  FileImage,
  Palette,
  X,
  Smile,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import EmojiPicker from 'emoji-picker-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

type ColorOption = {
  name: string;
  value: string;
};

const colorOptions: ColorOption[] = [
  { name: 'Default', value: '#ffffff' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Lime', value: '#84cc16' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Sky', value: '#0ea5e9' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Fuchsia', value: '#d946ef' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Rose', value: '#f43f5e' },
];

interface InsertDialogProps {
  onInsert: (html: string) => void;
  title: string;
  children: React.ReactNode;
  trigger: React.ReactNode;
}

// This is a fixed dialog component that properly handles insertion
function InsertDialog({ onInsert, title, children, trigger }: InsertDialogProps) {
  const [open, setOpen] = useState(false);

  // Create a memoized callback to handle insertion and close the dialog
  const handleContentInsert = React.useCallback((html: string) => {
    onInsert(html);
    setOpen(false);
  }, [onInsert, setOpen]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Enter the details below to insert into your profile.
          </DialogDescription>
        </DialogHeader>
        {React.cloneElement(children as React.ReactElement, { onInsert: handleContentInsert })}
      </DialogContent>
    </Dialog>
  );
};

interface ImageInsertProps {
  onInsert: (html: string) => void;
}

const ImageInsert = ({ onInsert }: ImageInsertProps) => {
  const [url, setUrl] = useState('');
  const [alt, setAlt] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [activeTab, setActiveTab] = useState<string>('url');

  const handleInsert = () => {
    if (!url) return;
    
    const style = [];
    if (width) style.push(`width: ${width}px`);
    if (height) style.push(`height: ${height}px`);
    
    const styleAttr = style.length > 0 ? ` style="${style.join('; ')}"` : '';
    const altAttr = alt ? ` alt="${alt}"` : '';
    
    const html = `<img src="${url}"${altAttr}${styleAttr} class="profile-image" />`;
    onInsert(html);
  };

  return (
    <div className="space-y-4 py-4">
      <Tabs defaultValue="url" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="url">Image URL</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
        </TabsList>
        <TabsContent value="url" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="image-url">Image URL</Label>
            <Input
              id="image-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="image-alt">Alt Text</Label>
            <Input
              id="image-alt"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Description of the image"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="image-width">Width (px)</Label>
              <Input
                id="image-width"
                value={width}
                onChange={(e) => setWidth(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Auto"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image-height">Height (px)</Label>
              <Input
                id="image-height"
                value={height}
                onChange={(e) => setHeight(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Auto"
              />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="gallery" className="space-y-4 mt-4">
          <div className="grid grid-cols-3 gap-2">
            {[
              '/assets/crime-1.jpg', 
              '/assets/crime-2.jpg', 
              '/assets/crime-3.jpg',
              '/assets/badge-1.png',
              '/assets/badge-2.png',
              '/assets/badge-3.png',
            ].map((img, i) => (
              <div 
                key={i} 
                className="cursor-pointer border-2 border-transparent hover:border-primary rounded overflow-hidden aspect-square"
                onClick={() => {
                  setUrl(img);
                  setActiveTab('url');
                }}
              >
                <div className="bg-gray-800 w-full h-full flex items-center justify-center">
                  <FileImage className="h-10 w-10 text-gray-500" />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Gallery images coming soon - upload your own images first</p>
        </TabsContent>
      </Tabs>

      <DialogFooter>
        <Button type="button" onClick={handleInsert}>Insert Image</Button>
      </DialogFooter>
    </div>
  );
};

interface LinkInsertProps {
  onInsert: (html: string) => void;
}

const LinkInsert = ({ onInsert }: LinkInsertProps) => {
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');

  const handleInsert = () => {
    if (!url) return;
    const linkText = text || url;
    const html = `<a href="${url}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
    onInsert(html);
  };

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="link-url">URL</Label>
        <Input
          id="link-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="link-text">Link Text</Label>
        <Input
          id="link-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Click here"
        />
      </div>
      <DialogFooter>
        <Button type="button" onClick={handleInsert}>Insert Link</Button>
      </DialogFooter>
    </div>
  );
};

export function RichTextEditor({ value, onChange, className, placeholder }: RichTextEditorProps) {
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>('#ffffff');

  const handleTextFormatting = (tag: string, attribute?: string, attributeValue?: string) => {
    if (!textAreaRef.current) return;

    const startPos = textAreaRef.current.selectionStart;
    const endPos = textAreaRef.current.selectionEnd;
    const selectedText = value.substring(startPos, endPos);
    
    let formattedText = '';
    
    if (attribute && attributeValue) {
      formattedText = `<${tag} ${attribute}="${attributeValue}">${selectedText}</${tag}>`;
    } else {
      formattedText = `<${tag}>${selectedText}</${tag}>`;
    }
    
    const newText = value.substring(0, startPos) + formattedText + value.substring(endPos);
    onChange(newText);
    
    // Set focus back to textarea
    setTimeout(() => {
      if (textAreaRef.current) {
        textAreaRef.current.focus();
        textAreaRef.current.selectionStart = startPos + formattedText.length;
        textAreaRef.current.selectionEnd = startPos + formattedText.length;
      }
    }, 0);
  };

  const handleInsert = (html: string) => {
    if (!textAreaRef.current) return;

    const startPos = textAreaRef.current.selectionStart;
    const newText = value.substring(0, startPos) + html + value.substring(startPos);
    onChange(newText);
    
    // Set focus back to textarea
    setTimeout(() => {
      if (textAreaRef.current) {
        textAreaRef.current.focus();
        const newCursorPos = startPos + html.length;
        textAreaRef.current.selectionStart = newCursorPos;
        textAreaRef.current.selectionEnd = newCursorPos;
      }
    }, 0);
  };

  const handleEmojiSelect = (emojiData: any) => {
    handleInsert(emojiData.emoji);
  };

  const insertTableTemplate = () => {
    const tableHtml = `
<table style="width:100%; border-collapse: collapse; margin: 10px 0;">
  <tr>
    <th style="border: 1px solid #444; padding: 8px; background-color: #222;">Header 1</th>
    <th style="border: 1px solid #444; padding: 8px; background-color: #222;">Header 2</th>
    <th style="border: 1px solid #444; padding: 8px; background-color: #222;">Header 3</th>
  </tr>
  <tr>
    <td style="border: 1px solid #444; padding: 8px;">Row 1, Cell 1</td>
    <td style="border: 1px solid #444; padding: 8px;">Row 1, Cell 2</td>
    <td style="border: 1px solid #444; padding: 8px;">Row 1, Cell 3</td>
  </tr>
  <tr>
    <td style="border: 1px solid #444; padding: 8px;">Row 2, Cell 1</td>
    <td style="border: 1px solid #444; padding: 8px;">Row 2, Cell 2</td>
    <td style="border: 1px solid #444; padding: 8px;">Row 2, Cell 3</td>
  </tr>
</table>
    `.trim();
    
    handleInsert(tableHtml);
  };

  const insertCardTemplate = () => {
    const cardHtml = `
<div style="border: 1px solid #444; border-radius: 8px; overflow: hidden; margin: 10px 0; background-color: #1a1a1a;">
  <div style="padding: 12px; border-bottom: 1px solid #444; background-color: #222;">
    <h3 style="margin: 0; color: #e5e5e5;">Card Title</h3>
  </div>
  <div style="padding: 16px;">
    <p style="margin: 0 0 10px 0;">This is a sample card content. Replace with your own content.</p>
  </div>
</div>
    `.trim();
    
    handleInsert(cardHtml);
  };
  
  // Generate a random profile template
  const generateRandomProfile = () => {
    // Array of theme configurations
    const themes = [
      // Neon Noir Theme
      {
        name: "Neon Noir",
        background: "#000000",
        text: "#ffffff",
        accent1: "#ff0099",
        accent2: "#00ffcc",
        headerStyle: "text-transform: uppercase; letter-spacing: 3px; background: linear-gradient(90deg, #ff0099, #00ffcc); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; text-shadow: 0 0 10px rgba(255, 0, 153, 0.5);",
        cardBackground: "#111111",
        tagline: "SHADOW OPERATOR • MASTER OF DECEPTION • FEARED BY MANY",
        quote: "The city streets tell stories of my legend. Those who cross me don't live to tell theirs."
      },
      // Vintage Mafia Theme
      {
        name: "Vintage Mafia",
        background: "#1a1207",
        text: "#e8d9c0",
        accent1: "#c0963c",
        accent2: "#6b4226",
        headerStyle: "font-family: 'Georgia', serif; border-bottom: 2px solid #c0963c; color: #c0963c; text-shadow: 1px 1px 2px rgba(0,0,0,0.7);",
        cardBackground: "#221a0f",
        tagline: "CAPO DI TUTTI CAPI • RESPECT EARNED • LOYALTY DEMANDED",
        quote: "Family is everything. Loyalty is forever. Betrayal is fatal."
      },
      // High-Tech Hacker Theme
      {
        name: "Digital Underground",
        background: "#0a0e17",
        text: "#e4f0fb",
        accent1: "#0dff92",
        accent2: "#0099ff",
        headerStyle: "font-family: 'Courier New', monospace; color: #0dff92; text-shadow: 0 0 5px rgba(13, 255, 146, 0.8); border-bottom: 1px solid rgba(13, 255, 146, 0.5);",
        cardBackground: "#121a29",
        tagline: "ELITE HACKER • DIGITAL PHANTOM • SYSTEM BREAKER",
        quote: "Behind every secure system is a backdoor waiting to be found. I find them all."
      },
      // Blood Syndicate Theme
      {
        name: "Blood Syndicate",
        background: "#1a0505",
        text: "#f0e3e3",
        accent1: "#b91c1c",
        accent2: "#7f1d1d",
        headerStyle: "color: #b91c1c; text-transform: uppercase; letter-spacing: 2px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5); border-bottom: 2px solid #b91c1c;",
        cardBackground: "#2a0a0a",
        tagline: "BLOOD BROTHER • ENFORCER • SHADOW EXECUTIONER",
        quote: "Respect is written in blood. My ledger has many pages, and they're all red."
      },
      // Luxury Kingpin Theme
      {
        name: "Luxury Kingpin",
        background: "#0f172a",
        text: "#faf5ff",
        accent1: "#fbbf24",
        accent2: "#9333ea",
        headerStyle: "font-family: 'Arial', sans-serif; color: #fbbf24; font-weight: bold; text-shadow: 1px 1px 10px rgba(251, 191, 36, 0.3); border-bottom: 1px solid #fbbf24;",
        cardBackground: "#1e293b",
        tagline: "EMPIRE BUILDER • WEALTH MAGNET • UNTOUCHABLE",
        quote: "Others chase money. I print it. Others seek power. I embody it."
      }
    ];
    
    // Select a random theme
    const theme = themes[Math.floor(Math.random() * themes.length)];
    
    // Profile statistics - generate random percentages
    const stats = [
      { name: "STRENGTH", value: Math.floor(Math.random() * 40) + 60 },
      { name: "INTELLIGENCE", value: Math.floor(Math.random() * 40) + 60 },
      { name: "STEALTH", value: Math.floor(Math.random() * 40) + 60 },
      { name: "INFLUENCE", value: Math.floor(Math.random() * 40) + 60 }
    ];
    
    // Generate random achievements
    const achievements = [
      ["MASTER STRATEGIST", "Orchestrated the perfect heist with zero casualties"],
      ["SHADOW NETWORK", "Built an information network spanning three cities"],
      ["ESCAPE ARTIST", "Never been caught despite numerous close calls"],
      ["WEALTH ACCUMULATOR", "Amassed a fortune that rivals small nations"],
      ["RESPECTED LEADER", "Commands loyalty through respect, not fear"],
      ["RUTHLESS TACTICIAN", "Known for brutal efficiency in all operations"]
    ];
    
    // Pick 3 random achievements
    const selectedAchievements = [];
    while(selectedAchievements.length < 3) {
      const achievement = achievements[Math.floor(Math.random() * achievements.length)];
      if (!selectedAchievements.some(a => a[0] === achievement[0])) {
        selectedAchievements.push(achievement);
      }
    }
    
    // Create the HTML template
    const profileHtml = `
<!-- ${theme.name} Theme Profile -->
<div style="background-color: ${theme.background}; color: ${theme.text}; padding: 20px; font-family: Arial, sans-serif; border-radius: 10px;">
  
  <!-- Profile Guidelines - Will not appear in preview mode -->
  <div style="background-color: rgba(0,0,0,0.7); border: 1px dashed #ffffff50; padding: 10px; margin-bottom: 20px; border-radius: 5px;">
    <h3 style="color: white; margin-top: 0;">HOW TO CUSTOMIZE YOUR PROFILE</h3>
    <p style="color: #ccc; margin-bottom: 5px; font-size: 0.9em;">Look for the highlighted instructions throughout this template. You can:</p>
    <ul style="color: #ccc; font-size: 0.9em;">
      <li>Replace the placeholder image with your own</li>
      <li>Edit your personal quote and tagline</li>
      <li>Modify your stats to show your criminal specialties</li>
      <li>Customize your achievements to reflect your criminal career</li>
      <li>Change colors and styling using the editor toolbar above</li>
    </ul>
    <p style="color: #ccc; font-size: 0.9em;">Delete this entire instruction box when you're done customizing!</p>
  </div>
  <!-- Header Section -->
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="font-size: 2.5em; margin: 0; ${theme.headerStyle}">
      EXTORTIONIST
    </h1>
    <p style="margin-top: 5px; color: ${theme.text}; opacity: 0.7; font-style: italic;">${theme.name.toUpperCase()} PROFILE</p>
  </div>

  <!-- Main Grid Layout -->
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
    <!-- Left Column - Bio and Quote -->
    <div style="background-color: ${theme.cardBackground}; padding: 20px; border-radius: 10px; position: relative; border: 1px solid rgba(${theme.accent1.replace('#', '')}, 0.3);">
      <!-- Profile image placeholder -->
      <div style="width: 100%; height: 200px; background: linear-gradient(45deg, ${theme.accent1}, ${theme.accent2}); border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 15px; position: relative; overflow: hidden;">
        <div style="background-color: rgba(0,0,0,0.7); padding: 10px 20px; border-radius: 5px; text-align: center;">
          <span style="color: white; font-weight: bold; letter-spacing: 2px; display: block; margin-bottom: 5px;">ADD YOUR IMAGE HERE</span>
          <span style="color: #cccccc; font-size: 0.8em; display: block;">Replace this entire div with an img tag:<br>&lt;img src="your-image-url-here" style="width: 100%; border-radius: 10px;" /&gt;</span>
        </div>
      </div>
      
      <div style="margin-top: 15px; position: relative; z-index: 1;">
        <p style="font-size: 1.1em; line-height: 1.5; color: ${theme.text}; font-style: italic; position: relative;">
          "${theme.quote}"
          <span style="position: absolute; top: -20px; right: 0; font-size: 0.7em; background-color: rgba(0,0,0,0.7); padding: 3px 6px; border-radius: 3px; color: #fff; font-style: normal;">EDIT THIS QUOTE</span>
        </p>
        <div style="width: 50px; height: 2px; background: linear-gradient(90deg, ${theme.accent1}, ${theme.accent2}); margin: 10px 0;"></div>
        <p style="color: ${theme.text}; opacity: 0.7; position: relative;">
          ${theme.tagline}
          <span style="position: absolute; top: -20px; right: 0; font-size: 0.7em; background-color: rgba(0,0,0,0.7); padding: 3px 6px; border-radius: 3px; color: #fff;">CUSTOMIZE THIS TAGLINE</span>
        </p>
      </div>
    </div>
    
    <!-- Right Column - Stats and Info -->
    <div>
      <!-- Stats Box -->
      <div style="background-color: ${theme.cardBackground}; padding: 20px; border-radius: 10px; margin-bottom: 20px; border: 1px solid rgba(${theme.accent2.replace('#', '')}, 0.3);">
        <h2 style="color: ${theme.accent1}; margin-top: 0; border-bottom: 1px solid ${theme.accent2}; padding-bottom: 10px; position: relative;">
          CRIMINAL STATS
          <span style="position: absolute; top: 0; right: 0; font-size: 0.7em; background-color: rgba(0,0,0,0.7); padding: 3px 6px; border-radius: 3px; color: #fff;">CUSTOMIZE THESE STATS</span>
        </h2>
        
        <div style="display: grid; grid-template-columns: 1fr; gap: 15px;">
          ${stats.map(stat => `
          <div>
            <h3 style="color: ${theme.accent2}; margin-bottom: 5px; font-size: 0.9em;">${stat.name}</h3>
            <div style="height: 8px; background-color: rgba(255,255,255,0.1); border-radius: 4px; position: relative; overflow: hidden;">
              <div style="position: absolute; top: 0; left: 0; height: 100%; width: ${stat.value}%; background: linear-gradient(90deg, ${theme.accent1}, ${theme.accent2});"></div>
            </div>
            <div style="display: flex; justify-content: flex-end; font-size: 0.8em; margin-top: 2px; opacity: 0.7;">${stat.value}%</div>
          </div>
          `).join('')}
        </div>
        <div style="font-size: 0.7em; margin-top: 10px; color: rgba(255,255,255,0.5); text-align: center; padding: 5px; background-color: rgba(0,0,0,0.2); border-radius: 4px;">
          Edit the stats by changing each stat name and percentage value. You can also add or remove stats as needed.
        </div>
      </div>
    </div>
  </div>
  
  <!-- Accomplishments Section -->
  <div style="margin-top: 20px; background-color: ${theme.cardBackground}; padding: 20px; border-radius: 10px; border: 1px solid rgba(${theme.accent1.replace('#', '')}, 0.3);">
    <h2 style="color: ${theme.accent1}; margin-top: 0; border-bottom: 1px solid ${theme.accent2}; padding-bottom: 10px; position: relative;">
      NOTABLE ACHIEVEMENTS
      <span style="position: absolute; top: 0; right: 0; font-size: 0.7em; background-color: rgba(0,0,0,0.7); padding: 3px 6px; border-radius: 3px; color: #fff;">EDIT THESE ACHIEVEMENTS</span>
    </h2>
    
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 20px;">
      ${selectedAchievements.map(achievement => `
      <!-- Achievement Card -->
      <div style="background-color: rgba(0,0,0,0.2); padding: 15px; border-radius: 5px; border-left: 3px solid ${theme.accent1};">
        <h3 style="color: ${theme.accent2}; margin-top: 0; margin-bottom: 5px; font-size: 0.9em;">${achievement[0]}</h3>
        <p style="color: ${theme.text}; opacity: 0.7; margin: 0; font-size: 0.8em;">${achievement[1]}</p>
      </div>
      `).join('')}
    </div>
  </div>
  
  <!-- Footer Section -->
  <div style="margin-top: 30px; text-align: center; padding: 20px 0; border-top: 1px solid rgba(255,255,255,0.1);">
    <p style="color: ${theme.text}; opacity: 0.5; font-size: 0.8em; margin: 0;">© EXTORTIONIST 2025 • ${theme.name.toUpperCase()} PROFILE</p>
  </div>
</div>`;
    
    handleInsert(profileHtml);
  };

  return (
    <div className={cn("rich-text-editor space-y-2", className)}>
      <div className="flex flex-wrap gap-1 p-1 bg-dark-lighter border border-border rounded-md mb-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Bold"
          onClick={() => handleTextFormatting('b')}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Italic"
          onClick={() => handleTextFormatting('i')}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Underline"
          onClick={() => handleTextFormatting('u')}
        >
          <Underline className="h-4 w-4" />
        </Button>
        
        <Separator orientation="vertical" className="mx-1 h-6 my-1" />
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Heading 1"
          onClick={() => handleTextFormatting('h1')}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Heading 2"
          onClick={() => handleTextFormatting('h2')}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Heading 3"
          onClick={() => handleTextFormatting('h3')}
        >
          <Heading3 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Paragraph"
          onClick={() => handleTextFormatting('p')}
        >
          <Type className="h-4 w-4" />
        </Button>
        
        <Separator orientation="vertical" className="mx-1 h-6 my-1" />
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Bulleted List"
          onClick={() => handleInsert("<ul>\n  <li>List item 1</li>\n  <li>List item 2</li>\n  <li>List item 3</li>\n</ul>")}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Numbered List"
          onClick={() => handleInsert("<ol>\n  <li>List item 1</li>\n  <li>List item 2</li>\n  <li>List item 3</li>\n</ol>")}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        
        <Separator orientation="vertical" className="mx-1 h-6 my-1" />
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Align Left"
          onClick={() => handleTextFormatting('div', 'style', 'text-align: left')}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Align Center"
          onClick={() => handleTextFormatting('div', 'style', 'text-align: center')}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Align Right"
          onClick={() => handleTextFormatting('div', 'style', 'text-align: right')}
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-6 my-1" />

        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              title="Text Color"
            >
              <Palette className="h-4 w-4" style={{ color: selectedColor }} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2">
            <div className="grid grid-cols-6 gap-1">
              {colorOptions.map((color) => (
                <div
                  key={color.value}
                  className={cn(
                    "w-8 h-8 rounded cursor-pointer border",
                    selectedColor === color.value ? "border-white ring-2 ring-primary" : "border-border"
                  )}
                  title={color.name}
                  style={{ backgroundColor: color.value }}
                  onClick={() => {
                    setSelectedColor(color.value);
                    handleTextFormatting('span', 'style', `color: ${color.value}`);
                  }}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="mx-1 h-6 my-1" />
        
        <InsertDialog
          title="Insert Image"
          onInsert={handleInsert}
          trigger={
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Insert Image"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
          }
        >
          <ImageInsert onInsert={function(){}} />
        </InsertDialog>
        
        <InsertDialog
          title="Insert Link"
          onInsert={handleInsert}
          trigger={
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Insert Link"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          }
        >
          <LinkInsert onInsert={function(){}} />
        </InsertDialog>

        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              title="Insert Emoji"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <EmojiPicker 
              onEmojiClick={handleEmojiSelect} 
              width={320}
              height={400}
              lazyLoadEmojis={true}
              theme="dark"
            />
          </PopoverContent>
        </Popover>
        
        <Separator orientation="vertical" className="mx-1 h-6 my-1" />
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Insert Table"
          onClick={insertTableTemplate}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <line x1="3" y1="15" x2="21" y2="15"></line>
            <line x1="9" y1="3" x2="9" y2="21"></line>
            <line x1="15" y1="3" x2="15" y2="21"></line>
          </svg>
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Insert Card"
          onClick={insertCardTemplate}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <rect x="2" y="3" width="20" height="18" rx="2" ry="2"></rect>
            <line x1="2" y1="9" x2="22" y2="9"></line>
          </svg>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="ml-1"
          title="Generate Random Profile Design"
          onClick={generateRandomProfile}
          style={{ 
            background: 'linear-gradient(90deg, rgba(138, 43, 226, 0.2), rgba(255, 100, 100, 0.2))',
            border: '1px solid rgba(138, 43, 226, 0.5)'
          }}
        >
          Randomize Profile Design
        </Button>
        
        <Separator orientation="vertical" className="mx-1 h-6 my-1" />
        
        <Button
          variant={previewMode ? "default" : "ghost"}
          size="icon"
          className="h-8 w-8"
          title="Toggle Preview"
          onClick={() => setPreviewMode(!previewMode)}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      
      {previewMode ? (
        <Card className="p-4 min-h-[300px] bg-dark-lighter">
          <div 
            className="prose prose-invert prose-sm max-w-none mb-4 profile-html-content"
            dangerouslySetInnerHTML={{ __html: value }}
          />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setPreviewMode(false)}
            className="mt-2"
          >
            Return to Edit Mode
          </Button>
        </Card>
      ) : (
        <Textarea
          ref={textAreaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[300px] font-mono text-sm resize-none bg-dark-lighter"
        />
      )}
      
      <div className="text-xs text-muted-foreground">
        <p>Tip: Use the buttons above to format your text and add elements to your profile.</p>
      </div>
    </div>
  );
}