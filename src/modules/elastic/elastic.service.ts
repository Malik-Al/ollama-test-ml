// import { Injectable, Logger } from '@nestjs/common';
// import { Client } from '@elastic/elasticsearch';

// @Injectable()
// export class ElasticService {
//   private readonly logger = new Logger(ElasticService.name);
//   private client: any;

//   constructor() {
//     this.client = new Client({ node: 'http://localhost:9200' });
//   }

//   async createIndex(companyId: string) {
//     const indexName = `company_${companyId}_chat`;
//     const exists = await this.client.indices.exists({ index: indexName });
//     if (!exists) {
//       await this.client.indices.create({
//         index: indexName,
//         body: {
//           mappings: {
//             properties: {
//               userId: { type: 'keyword' },
//               question: { type: 'text' },
//               answer: { type: 'text' },
//               embedding: { type: 'dense_vector', dims: 768 },
//               timestamp: { type: 'date' },
//               locale: { type: 'keyword' }
//             }
//           }
//         }
//       });
//       this.logger.log(`Created index ${indexName}`);
//     }
//     return indexName;
//   }

//   async addMessage(index: string, data: any) {
//     await this.client.index({
//       index,
//       body: data,
//     });
//   }

//   async searchSimilar(index: string, vector: number[], size = 10) {
//     const { body } = await this.client.search({
//       index,
//       size,
//       query: {
//         script_score: {
//           query: { match_all: {} },
//           script: {
//             source: "cosineSimilarity(params.vector, 'embedding') + 1.0",
//             params: { vector },
//           }
//         }
//       }
//     });
//     return body.hits.hits.map(hit => hit._source);
//   }
// }
