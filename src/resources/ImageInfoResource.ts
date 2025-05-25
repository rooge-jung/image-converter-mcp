import { MCPResource, ResourceContent } from "mcp-framework";

class ImageInfoResource extends MCPResource {
  uri = "resource://image_info";
  name = "ImageInfo";
  description = "ImageInfo resource description";
  mimeType = "application/json";

  async read(): Promise<ResourceContent[]> {
    return [
      {
        uri: this.uri,
        mimeType: this.mimeType,
        text: JSON.stringify({ message: "Hello from ImageInfo resource" }),
      },
    ];
  }
}

export default ImageInfoResource;