'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import Script from 'next/script'
import { FaFacebookSquare, FaInstagram, FaLinkedin } from 'react-icons/fa'
import { SiCanva } from 'react-icons/si'
import Link from 'next/link'
import { LayoutGrid, Columns, Rows } from 'lucide-react'

// Facebook SDK Typen
declare global {
  interface Window {
    FB: {
      init: (params: { appId: string, version: string }) => void
      login: (callback: (response: { authResponse?: { accessToken: string } }) => void, params: { scope: string }) => void
      api: (path: string, callback: (response: any) => void) => void
    }
  }
}

interface SocialConnection {
  connected: boolean
  pageId?: string
  pageName?: string
  accessToken?: string
}

type LayoutType = 'single' | 'double' | 'triple'

export default function SocialSettings() {
  const [facebookConnection, setFacebookConnection] = useState<SocialConnection>({ connected: false })
  const [instagramConnection, setInstagramConnection] = useState<SocialConnection>({ connected: false })
  const [linkedinConnection, setLinkedinConnection] = useState<SocialConnection>({ connected: false })
  const [canvaConnection, setCanvaConnection] = useState<SocialConnection>({ connected: false })
  const [layoutType, setLayoutType] = useState<LayoutType>('double')

  // Facebook SDK initialisieren
  const initFacebookSDK = () => {
    if (typeof window !== 'undefined' && window.FB) {
      window.FB.init({
        appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '',
        version: 'v18.0'
      })
    }
  }

  // Facebook verbinden
  const connectFacebook = async () => {
    if (typeof window !== 'undefined' && window.FB) {
      window.FB.login((response) => {
        if (response.authResponse) {
          window.FB.api('/me/accounts', (response) => {
            if (response.data && response.data.length > 0) {
              setFacebookConnection({
                connected: true,
                pageId: response.data[0].id,
                pageName: response.data[0].name,
                accessToken: response.data[0].access_token
              })
            }
          })
        }
      }, { scope: 'pages_show_list,pages_read_engagement,pages_manage_posts' })
    }
  }

  // LinkedIn verbinden
  const connectLinkedin = async () => {
    // LinkedIn OAuth Flow implementieren
    setLinkedinConnection({
      connected: true,
      pageId: 'dummy-page-id',
      pageName: 'Meine LinkedIn Seite'
    })
  }

  // Instagram verbinden
  const connectInstagram = async () => {
    // Instagram OAuth Flow implementieren
    setInstagramConnection({
      connected: true,
      pageId: 'dummy-page-id',
      pageName: 'Mein Instagram Account'
    })
  }

  // Canva verbinden
  const connectCanva = async () => {
    if (canvaConnection.connected) {
      // Trennen
      const response = await fetch('/api/auth/canva/disconnect', {
        method: 'POST'
      })
      
      if (response.ok) {
        setCanvaConnection({ connected: false })
      }
    } else {
      // Verbinden
      window.location.href = '/api/auth/canva'
    }
  }

  // Canva Verbindungsstatus beim Laden prüfen
  useEffect(() => {
    const checkCanvaConnection = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const success = urlParams.get('success');
      const error = urlParams.get('error');
      const details = urlParams.get('details');

      if (success === 'true') {
        setCanvaConnection({ connected: true });
      } else if (error) {
        let errorMessage = 'Ein Fehler ist aufgetreten.';
        
        switch(error) {
          case 'auth_failed':
            errorMessage = 'Die Authentifizierung mit Canva ist fehlgeschlagen.';
            break;
          case 'no_code':
            errorMessage = 'Kein Autorisierungscode von Canva erhalten.';
            break;
          case 'no_verifier':
            errorMessage = 'Sicherheitstoken nicht gefunden. Bitte versuchen Sie es erneut.';
            break;
          case 'token_exchange_failed':
            errorMessage = `Token-Austausch fehlgeschlagen.${details ? `\n${decodeURIComponent(details)}` : ''}`;
            break;
          default:
            errorMessage = `Ein unbekannter Fehler ist aufgetreten: ${error}${details ? `\n${decodeURIComponent(details)}` : ''}`;
        }
        
        alert(errorMessage);
        setCanvaConnection({ connected: false });
      }
    };

    checkCanvaConnection();
  }, []);

  // PKCE Code Challenge Funktion
  const generateRandomString = (length: number) => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let text = '';
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  };

  const generateCodeChallenge = async (codeVerifier: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    const base64Url = btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    return base64Url;
  };

  const handleLayoutToggle = () => {
    setLayoutType(current => {
      if (current === 'single') return 'double'
      if (current === 'double') return 'triple'
      return 'single'
    })
  }

  const getLayoutIcon = () => {
    switch (layoutType) {
      case 'single':
        return <Rows className="w-5 h-5" />
      case 'double':
        return <Columns className="w-5 h-5" />
      case 'triple':
        return <LayoutGrid className="w-5 h-5" />
    }
  }

  const getLayoutText = () => {
    switch (layoutType) {
      case 'single':
        return '1 Spalte'
      case 'double':
        return '2 Spalten'
      case 'triple':
        return '3 Spalten'
    }
  }

  const getGridClass = () => {
    switch (layoutType) {
      case 'single':
        return 'grid grid-cols-1 gap-6'
      case 'double':
        return 'grid grid-cols-1 md:grid-cols-2 gap-6'
      case 'triple':
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-6">
          <Link 
            href="/dashboard/social" 
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            ← Einstellungen
          </Link>
          <h1 className="text-2xl font-bold text-white">Accounts verbinden</h1>
        </div>
        <button
          onClick={handleLayoutToggle}
          className="inline-flex items-center justify-center gap-2 rounded-md h-10 px-4 py-2 bg-gray-900/50 border border-white/10 hover:bg-gray-900/70 transition-colors text-gray-300"
          title={`Layout ändern (${getLayoutText()})`}
        >
          {getLayoutIcon()}
          <span className="hidden sm:inline">{getLayoutText()}</span>
        </button>
      </div>

      <div className={getGridClass()}>
        {/* Facebook Card */}
        <Card className="bg-card border-border hover:border-border/80 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <FaFacebookSquare className="w-8 h-8 text-[#1877F2]" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground">Facebook</h3>
                    <div 
                      className={`w-2 h-2 rounded-full ${
                        facebookConnection.connected ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {facebookConnection.connected 
                      ? `${facebookConnection.pageName}`
                      : ''}
                  </p>
                </div>
              </div>
              <Button
                variant={facebookConnection.connected ? "destructive" : "default"}
                onClick={connectFacebook}
              >
                {facebookConnection.connected ? 'Trennen' : 'Verbinden'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instagram Card */}
        <Card className="bg-card border-border hover:border-border/80 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <FaInstagram className="w-8 h-8 text-[#E4405F]" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground">Instagram</h3>
                    <div 
                      className={`w-2 h-2 rounded-full ${
                        instagramConnection.connected ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {instagramConnection.connected 
                      ? `${instagramConnection.pageName}`
                      : ''}
                  </p>
                </div>
              </div>
              <Button
                variant={instagramConnection.connected ? "destructive" : "default"}
                onClick={connectInstagram}
              >
                {instagramConnection.connected ? 'Trennen' : 'Verbinden'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* LinkedIn Card */}
        <Card className="bg-card border-border hover:border-border/80 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <FaLinkedin className="w-8 h-8 text-[#0A66C2]" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground">LinkedIn</h3>
                    <div 
                      className={`w-2 h-2 rounded-full ${
                        linkedinConnection.connected ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {linkedinConnection.connected 
                      ? `${linkedinConnection.pageName}`
                      : ''}
                  </p>
                </div>
              </div>
              <Button
                variant={linkedinConnection.connected ? "destructive" : "default"}
                onClick={connectLinkedin}
              >
                {linkedinConnection.connected ? 'Trennen' : 'Verbinden'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Canva Card */}
        <Card className="bg-card border-border hover:border-border/80">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <SiCanva className="text-[#00C4CC] text-2xl" />
                <h3 className="text-lg font-semibold text-foreground">Canva</h3>
              </div>
              <Badge variant={canvaConnection.connected ? "secondary" : "outline"}>
                {canvaConnection.connected ? "Verbunden" : "Nicht verbunden"}
              </Badge>
            </div>
            <p className="text-muted-foreground mb-4">
              Verbinden Sie Ihr Canva-Konto, um auf Ihre Design-Assets zuzugreifen.
            </p>
            <Button
              onClick={connectCanva}
              variant={canvaConnection.connected ? "destructive" : "default"}
              className="w-full mb-2"
            >
              {canvaConnection.connected ? "Trennen" : "Verbinden"}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open('/api/auth/canva/test', '_blank')}
            >
              OAuth Flow Testen
            </Button>
          </CardContent>
        </Card>
      </div>

      <Script
        src="https://connect.facebook.net/en_US/sdk.js"
        onLoad={initFacebookSDK}
      />
    </div>
  )
} 