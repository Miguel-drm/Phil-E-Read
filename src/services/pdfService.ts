import axios from 'axios';

export const fetchPdfFromCloudinary = async (pdfUrl: string): Promise<Blob> => {
  try {
    console.log('Fetching PDF from:', pdfUrl);
    const response = await axios.get(pdfUrl, {
      responseType: 'blob',
      headers: {
        'Accept': 'application/pdf'
      }
    });
    console.log('PDF fetch response:', response.status);
    return response.data;
  } catch (error: any) {
    console.error('Error details:', {
      message: error.message,
      response: error.response,
      status: error?.response?.status
    });
    throw new Error('Failed to fetch PDF from Cloudinary');
  }
};