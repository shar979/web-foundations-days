# SnapShare - System Scaling Plan & Architecture

## 1. Assumptions and Daily Active Users (DAU)
- **Total Registered Users:** 10,000,000
- **Activity Rate:** 10% of registered users are active daily.
- **User Actions:** Each active user uploads 1 photo per day and views 50 feed pages per day.
- **File Sizes:** Average raw photo size is 2 MB; generated thumbnail size is 50 KB.
- **Daily Active Users (DAU) Calculation:**
  DAU = 10,000,000* 0.10 = 1,000,000  active users/day

---

## 2. Traffic and Storage Estimates
- **Uploads per Second (Average):**
1,000,000  photos* 1 uploded photo by the user = 1000000 uploads per day
1000000/ 86400= 11.57 uploads per second.

- **Feed Views per Second (Average):**
 1,000,000*50/86,400  seconds= 578.70 feed viewsper seconds

- **Feed Views per Second (Peak, using 5× factor):**
 Peak feed views per Second = Average Feed views per second*5
 578.7037*5 = 2894 feed views per second at peak

- **Storage per Year:**
  - Original photos: $1,000,000 \text{ photos/day} \times 365 \text{ days} = 365,000,000 \text{ photos/year}$
  - Raw storage: $365,000,000 \times 2 \text{ MB} = 730,000,000 \text{ MB} = 730 \text{ TB/year}$
  - Thumbnail storage: $365,000,000 \times 0.05 \text{ MB} = 18,250,000 \text{ MB} = 18.25 \text{ TB/year}$
  - **Total Storage Required:** $\approx 748.25 \text{ TB/year}$

---

## 3. Read-Heavy vs. Write-Heavy Analysis
SnapShare is heavily **read-heavy** (a ratio of roughly 50 read requests for every 1 write request). 
- **Design Implications:** Because users spend most of their time scrolling feeds rather than posting photos, the architecture must prioritize fast read operations. This requires aggressive caching layers, distributed Content Delivery Networks (CDNs) for static media, and database read replicas to distribute query loads.

---

## 4. Why Photos Do Not Go in the Database
Relational and standard databases are optimized for structured tabular data, transactional consistency (ACID), and fast indexing. Storing large binary blobs (like 2 MB photos) directly inside a database bloats database file sizes, severely degrades query performance, causes massive backup/recovery bottlenecks, and drives up expensive relational storage costs. Instead, raw photos and thumbnails are stored in **Distributed Object Storage** (e.g., AWS S3), while the database only stores metadata (file paths, user IDs, timestamps).

---

## 5. Architecture Diagram


                 [ Mobile / Web Clients ]
                           |
                           v
                        [ CDN ] <------> [ Object Storage ]
                           |                 Originals +
                           v                 Thumbnails
                    [ Load Balancer ]
                           |
              +------------+------------+
              |            |            |
              v            v            v
         [ App Server 1 ][ App Server 2 ][ App Server N ]
              |            |
              +------+-----+
                     |
          +----------+-----------+
          |                      |
          v                      v
     [ Redis Cache ]       [ Primary Database ]
          |                      |
          |                 Replication
          |                      |
          |                      v
          |               [ Read Replica ]
          |
          +---- Cached feed / metadata

Photo upload processing:
[ App Server ]
      |
      +----> [ Object Storage: Original Photo ]
      |
      +----> [ Message Queue ]
                    |
                    v
             [ Thumbnail Worker ]
                    |
                    +----> [ Object Storage: Thumbnail ]
                    |
                    +----> [ Primary Database:
                             Thumbnail metadata/status ]

---
## 6 Componenet explanation
*CDN : Caches and serves photo ffiles from edge locations closest to the user to minimize latency and bandwidth costs.

*Load Balancer:Distributes incoming client traffic evenely across multiple application servers to prevent overloading a single node.

*App Servers: Stateles backend nodes that process incoming HHTP requests, execute business logic, and coordinate storage workflows.

*Cache: In-memory data store used to cashe user feeds,session tokens, and frequently accessed metadata to reduce database load.

*Primary Database: Handles all write operations  and maintains strict ACID consistency.

*Database Read Replica: Handles heavy read traffic to offload the primary database.

*Object Storage: Scalable, durable distributed storage bucket designed specifically for saving raw image files and generated thumbnails.

*Message Queue: Asynchronously decouples heavy background tasks  from the main API response cycle.

*Worker Fleet: Background processing nodes that pull jobs from the queue to generate image thumbnails without blocking user uploads.

---
## 7 Step-by-step flow of uploading a photo
*User uploads a photo. The mobile or web client sends an upload request to SnapShare.

*Request reaches an app server. The load balancer routes the request to a healthy app server, which authenticates the user and validates the upload.

*Original photo is stored. The app server uploads the 2 MB original to object storage, preferably using a pre-signed upload URL for direct client-to-storage uploads.

*Metadata is saved. The application writes the photo's owner, object key, timestamp, and processing status to the primary database.

*Thumbnail job is queued. The application sends a job containing the photo's object key to the message queue.

*Worker creates a thumbnail. A background worker retrieves the original photo, generates the 50 KB thumbnail, and stores it in object storage.

*Processing status is updated. The worker records the thumbnail's object key and marks processing as complete in the database.

*Photo is delivered to feed viewers. When followers view their feeds, the app retrieves the relevant metadata and photo URLs, while the CDN delivers cached photo files where available.
## thumnail job is to:
Create a smaller version of the upoaded image.so our thumbnail of 50KB loads faster than photo of 2 MB when users scrolll through their feeds.

## Trade offs
Consistency vs Availability: Caching feed timelines in Redis improves feed-loading speed dramatically, but means new posts from followed users might take a few seconds to propagate across all caches .

Cost vs Performance: Implementing aggressive caching and global CDN distribution incurs higher infrastructure maintenance costs, but is necessary to deliver the sub-100ms latency required for a modern social media experience.