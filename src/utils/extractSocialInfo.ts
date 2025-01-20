export function extractSocialInfo(url: string): { platform: string; username: string } | null {
  try {
    // Add https:// if the URL doesn't have a protocol
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    const urlObj = new URL(fullUrl);

    // Instagram
    if (urlObj.hostname.includes('instagram.com')) {
      const username = urlObj.pathname.split('/')[1];
      return { platform: 'instagram', username };
    }
    
    // TikTok
    if (urlObj.hostname.includes('tiktok.com')) {
      const username = urlObj.pathname.split('/')[1];
      if (!username) return null;
      const cleanUsername = username.replace('@', '');
      return { 
        platform: 'tiktok', 
        username: `@${cleanUsername}` 
      };
    }

    // Twitter/X
    if (urlObj.hostname.includes('twitter.com') || urlObj.hostname.includes('x.com')) {
      const username = urlObj.pathname.split('/')[1];
      if (!username) return null;
      const cleanUsername = username.replace('@', '');
      return {
        platform: 'twitter',
        username: `@${cleanUsername}`
      };
    }

    // YouTube
    if (
      urlObj.hostname.includes('youtube.com') || 
      urlObj.hostname.includes('youtu.be')
    ) {
      if (urlObj.pathname.includes('/c/') || urlObj.pathname.includes('/user/')) {
        const username = urlObj.pathname.split('/').filter(Boolean)[1];
        return { platform: 'youtube', username };
      }
      if (urlObj.pathname.startsWith('/@')) {
        const username = urlObj.pathname.substring(2);
        return { platform: 'youtube', username };
      }
      if (urlObj.pathname.includes('/channel/')) {
        const channelId = urlObj.pathname.split('/').filter(Boolean)[1];
        return { platform: 'youtube', username: channelId };
      }
    }

    return null;
  } catch (error) {
    console.error('Error parsing social media URL:', error);
    return null;
  }
}