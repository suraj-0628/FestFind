import asyncio
import logging

from app.scraper.scheduler import run_scrape_job, start_scheduler

logging.basicConfig(level=logging.INFO)


async def main():
    logger = logging.getLogger(__name__)
    scheduler = start_scheduler()
    logger.info("Scheduler started. Scraping every 2 hours.")
    try:
        await asyncio.Event().wait()
    except KeyboardInterrupt:
        scheduler.shutdown()


if __name__ == "__main__":
    asyncio.run(main())
