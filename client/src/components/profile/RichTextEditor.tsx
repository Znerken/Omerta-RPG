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