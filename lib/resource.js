export class Resource {
  namespace = null;
  collectionName = null;

  constructor() {
    if (this.constructor === Resource) {
      throw new TypeError(
        'Abstract class "Resource" cannot be instantiated directly.'
      );
    }
  }
}
