export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
}

export const defaultSEO: SEOConfig = {
  title: 'EduLoans by Cashkaro - Your Education Finance Partner',
  description: 'Manage education loan applications, track status, upload documents, and get approved faster. Secure funding for your dream university.',
  keywords: ['education loan', 'student loan', 'study abroad', 'loan application', 'university funding', 'cashkaro'],
  canonical: 'https://yourdomain.com',
};

export const pageSEO = {
  studentDashboard: {
    title: 'Student Dashboard - Track Your Education Loans | EduLoans by Cashkaro',
    description: 'Manage your education loan applications, track status, upload documents, and get approved faster. View all your applications in one place.',
    keywords: ['student dashboard', 'loan tracking', 'application status', 'education loan management'],
  },
  studentApplication: {
    title: 'New Loan Application - EduLoans by Cashkaro',
    description: 'Apply for education loan in minutes. Get matched with best lenders and secure funding for your dream university.',
    keywords: ['loan application', 'apply for loan', 'education financing', 'student loan application'],
  },
};

export function generateStructuredData(type: 'WebApplication' | 'Organization' | 'BreadcrumbList', data?: any) {
  const schemas = {
    WebApplication: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'EduLoans by Cashkaro Student Portal',
      description: 'Education loan application management system for students',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        category: 'Education Loans',
      },
    },
    Organization: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'EduLoans by Cashkaro',
      description: 'Leading education loan provider helping students achieve their dreams',
      url: 'https://yourdomain.com',
    },
    BreadcrumbList: data ? {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: data.items?.map((item: any, index: number) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    } : null,
  };

  return schemas[type];
}

export function updateMetaTags(config: SEOConfig) {
  // Update title
  document.title = config.title;

  // Update meta description
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', config.description);
  }

  // Update keywords if provided
  if (config.keywords) {
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', config.keywords.join(', '));
    }
  }

  // Update canonical URL
  if (config.canonical) {
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = config.canonical;
  }
}
