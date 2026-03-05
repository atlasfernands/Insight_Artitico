
'use server'

import { getArtistData, getArtistTopTracks, getRelatedArtists, getArtistAlbums } from '@/lib/spotify';
import { supabase } from '@/lib/supabase';

export async function lookupArtist(urlOrId: string) {
  try {
    let artistId = urlOrId;
    
    // Extract ID from URL if necessary
    if (urlOrId.includes('spotify.com/')) {
      const match = urlOrId.match(/artist\/([a-zA-Z0-9]+)/);
      if (match && match[1]) {
        artistId = match[1];
      }
    }

    const [artist, topTracks, relatedArtists, albums] = await Promise.all([
      getArtistData(artistId),
      getArtistTopTracks(artistId),
      getRelatedArtists(artistId),
      getArtistAlbums(artistId)
    ]);

    // Save search history to Supabase (if configured)
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !artist.isMock) {
      try {
        await supabase.from('searches').insert({
          artist_id: artist.id,
          artist_name: artist.name,
          artist_image: artist.images[0]?.url,
          genres: artist.genres
        });
      } catch (err) {
        console.error('Erro ao salvar no Supabase:', err);
      }
    }

    return {
      success: true,
      data: {
        artist,
        topTracks,
        relatedArtists,
        albums
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erro ao buscar artista'
    };
  }
}

export async function getRecentSearches() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  
  try {
    const { data, error } = await supabase
      .from('searches')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Erro ao buscar buscas recentes:', err);
    return [];
  }
}
