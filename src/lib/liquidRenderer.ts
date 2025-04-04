import { Liquid, LiquidOptions } from 'liquidjs';
import { vfs } from './vfs';

interface RenderOptions {
  template?: string;
  mockData?: Record<string, any>;
}

class ShopifyLiquidRenderer {
  private engine: Liquid;
  private mockData: Record<string, any>;
  private cache: Record<string, string> = {};
  
  constructor() {
    // Create a custom file system resolver for Liquid
    const fileSystemOptions: LiquidOptions = {
      root: '/',
      extname: '.liquid',
      cache: false,
      globals: {},
      fs: {
        // Implement all required methods for the FS interface
        readFileSync: (file: string) => {
          // Normalize file path for lookups
          const filePath = file.startsWith('/') ? file.substring(1) : file;
          
          // Try to find the file in our VFS
          let fileContent: string | undefined;
          
          // Direct lookup
          const vfsFile = vfs.getFile(filePath);
          if (vfsFile && typeof vfsFile.content === 'string') {
            fileContent = vfsFile.content;
          }
          
          // Try with .liquid extension if not found
          if (!fileContent && !filePath.endsWith('.liquid')) {
            const liquidPath = `${filePath}.liquid`;
            const liquidFile = vfs.getFile(liquidPath);
            if (liquidFile && typeof liquidFile.content === 'string') {
              fileContent = liquidFile.content;
            }
          }
          
          // Try specific lookups for snippets, sections, etc.
          if (!fileContent) {
            // For snippets
            const snippetPath = `snippets/${filePath}`;
            const snippetFile = vfs.getFile(snippetPath);
            if (snippetFile && typeof snippetFile.content === 'string') {
              fileContent = snippetFile.content;
            }
            
            // For sections
            const sectionPath = `sections/${filePath}`;
            const sectionFile = vfs.getFile(sectionPath);
            if (sectionFile && typeof sectionFile.content === 'string') {
              fileContent = sectionFile.content;
            }
          }
          
          if (!fileContent) {
            console.warn(`File not found in VFS: ${filePath}`);
            return `<!-- File not found: ${filePath} -->`;
          }
          
          return fileContent;
        },
        existsSync: (file: string) => {
          // Normalize file path for lookups
          const filePath = file.startsWith('/') ? file.substring(1) : file;
          
          // Check if file exists in VFS
          if (vfs.getFile(filePath)) return true;
          
          // Try with .liquid extension
          if (!filePath.endsWith('.liquid') && vfs.getFile(`${filePath}.liquid`)) return true;
          
          // Try in snippets, sections paths
          if (vfs.getFile(`snippets/${filePath}`)) return true;
          if (vfs.getFile(`sections/${filePath}`)) return true;
          
          return false;
        },
        // Fix the async methods to match Promise-based signatures required by LiquidJS
        readFile: async (filepath: string): Promise<string> => {
          try {
            const content = this.engine.options.fs?.readFileSync(filepath);
            return content ?? '';
          } catch (err) {
            throw err;
          }
        },
        exists: async (filepath: string): Promise<boolean> => {
          return this.engine.options.fs?.existsSync(filepath) || false;
        },
        resolve: (root: string, file: string, ext: string) => {
          if (file.startsWith('/')) return file;
          return `${root}${file}${ext}`;
        }
      }
    };
    
    this.engine = new Liquid(fileSystemOptions);
    this.mockData = this.createDefaultMockData();
    
    // Register Shopify-specific filters and tags
    this.registerShopifyFilters();
    this.registerShopifyTags();
  }
  
  private registerShopifyFilters() {
    // Add common Shopify filters
    this.engine.registerFilter('asset_url', (input: string) => {
      return `assets/${input}`;
    });
    
    this.engine.registerFilter('img_url', (input: string, size: string = 'medium') => {
      return input || '';
    });
    
    this.engine.registerFilter('money', (input: number) => {
      return `$${input.toFixed(2)}`;
    });
    
    // Add more filters as needed
  }
  
  private registerShopifyTags() {
    // Example: section tag implementation
    this.engine.registerTag('section', {
      parse: function(tagToken, remainingTokens) {
        this.sectionName = tagToken.args.trim();
        this.templates = [];
      },
      render: async function(context) {
        const engine = context.getRegister()['liquid'] || this.liquid;
        const sectionName = await engine.evalValue(this.sectionName, context);
        try {
          // Try to find the section in our VFS
          let sectionPath = `sections/${sectionName}`;
          if (!sectionPath.endsWith('.liquid')) sectionPath += '.liquid';
          
          // Pass empty string as default value to avoid undefined
          const template = engine.options.fs?.readFileSync(sectionPath) || '';
          // Fix: Add the required template string parameter to parseAndRender
          return engine.parseAndRender(template, context.environments);
        } catch (error) {
          return `<!-- Section not found: ${sectionName} -->`;
        }
      }
    });
    
    // You can implement more Shopify-specific tags here
  }
  
  private createDefaultMockData(): Record<string, any> {
    // Create basic mock data structure to simulate a Shopify store
    return {
      shop: {
        name: 'Demo Store',
        email: 'example@example.com',
        url: '#',
        description: 'A demo store for theme preview',
        currency: 'USD'
      },
      product: {
        title: 'Sample Product',
        vendor: 'Sample Vendor',
        description: 'This is a sample product description.',
        price: 19.99,
        compare_at_price: 29.99,
        featured_image: 'https://via.placeholder.com/500x500',
        images: [
          'https://via.placeholder.com/500x500',
          'https://via.placeholder.com/500x500?text=2',
          'https://via.placeholder.com/500x500?text=3'
        ],
        tags: ['Sample', 'Demo', 'Test'],
        type: 'Sample Type',
        available: true
      },
      collections: {
        all: {
          title: 'All Products',
          products: Array(10).fill(null).map((_, i) => ({
            title: `Product ${i+1}`,
            price: Math.round((10 + Math.random() * 90) * 100) / 100,
            featured_image: `https://via.placeholder.com/300x300?text=Product${i+1}`
          }))
        }
      },
      cart: {
        item_count: 2,
        total_price: 39.98,
        items: [
          {
            title: 'Sample Product',
            quantity: 1,
            price: 19.99,
            line_price: 19.99,
            featured_image: 'https://via.placeholder.com/100x100'
          },
          {
            title: 'Another Product',
            quantity: 1,
            price: 19.99,
            line_price: 19.99,
            featured_image: 'https://via.placeholder.com/100x100?text=2'
          }
        ]
      },
      page: {
        title: 'Sample Page',
        content: '<p>This is a sample page content.</p>'
      }
    };
  }

  public setMockData(data: Record<string, any>) {
    this.mockData = { ...this.mockData, ...data };
  }
  
  public async render(options: RenderOptions = {}): Promise<string> {
    try {
      const { template = 'templates/index', mockData = {} } = options;
      const data = { ...this.mockData, ...mockData };
      
      // Get layout template
      let layoutTemplate: string | null = null;
      const layoutFiles = vfs.getFilesByPath('layout/');
      if (layoutFiles.length > 0) {
        const themeLayout = layoutFiles.find(f => f.name === 'theme.liquid') || layoutFiles[0];
        if (typeof themeLayout.content === 'string') {
          layoutTemplate = themeLayout.content;
        }
      }
      
      // Get content template
      let templatePath = template;
      if (!templatePath.endsWith('.liquid')) templatePath += '.liquid';
      
      // If template doesn't start with templates/, add it
      if (!templatePath.startsWith('templates/')) {
        templatePath = `templates/${templatePath}`;
      }
      
      const templateFile = vfs.getFile(templatePath);
      if (!templateFile) {
        return `<div class="error">Template not found: ${templatePath}</div>`;
      }
      
      if (typeof templateFile.content !== 'string') {
        return `<div class="error">Template is not text: ${templatePath}</div>`;
      }
      
      const templateContent = templateFile.content;
      let content = '';
      
      // Render the template first
      content = await this.engine.parseAndRender(templateContent, data);
      
      // Then render it in the layout if available
      if (layoutTemplate) {
        // In Shopify, {{ content_for_layout }} is replaced with the template content
        data.content_for_layout = content;
        content = await this.engine.parseAndRender(layoutTemplate, data);
      }

      // Process the rendered HTML to handle asset URLs
      content = this.processRenderedHTML(content);
      
      return content;
    } catch (error) {
      console.error('Error rendering template:', error);
      return `<div class="error">Error rendering template: ${error}</div>`;
    }
  }
  
  private processRenderedHTML(html: string): string {
    // Replace asset URLs with blob URLs or data URLs
    return html.replace(/href="assets\/([^"]+)"/g, (match, asset) => {
      const assetFile = vfs.getFile(`assets/${asset}`);
      if (!assetFile) return match;
      
      // For now, just keep as is - we'll handle asset serving through service worker
      return `href="assets/${asset}"`;
    }).replace(/src="assets\/([^"]+)"/g, (match, asset) => {
      const assetFile = vfs.getFile(`assets/${asset}`);
      if (!assetFile) return match;
      
      // For now, just keep as is - we'll handle asset serving through service worker
      return `src="assets/${asset}"`;
    });
  }
}

export const liquidRenderer = new ShopifyLiquidRenderer();
