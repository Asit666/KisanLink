1. “Okay, so in one sentence, what problem are you actually solving?”
“We’re solving the problem of farmers not knowing where, when, and to whom they can sell their produce at the best reliable price.”
2. “Why would a farmer use your platform when they already have a local trader?”
“We’re not trying to completely replace local traders. We give farmers more choices and transparent information, so they can compare buyers, prices, logistics, and payment reliability before deciding where to sell.”
3. “Where are you getting your mandi price data from?”
“We plan to integrate trusted government and authorized market-data sources, such as official mandi datasets/APIs where available. We’ll also clearly show the source and timestamp of each price.”
4. “How do you know the price shown in your app is genuine and up to date?”
“We don’t generate the mandi price ourselves. We fetch it from trusted sources, update it regularly, and display the source and last-updated time. If there’s a data mismatch, we can flag it instead of showing potentially misleading information.”
5. “You are predicting future prices. What happens if your prediction is wrong?”
“Our prediction is only a decision-support tool, not a guaranteed price. We’ll show the prediction along with a confidence level and historical trend, so the farmer can make the final decision.”
6. “How exactly are you deciding which buyer is best for a farmer?”
“We don’t consider only the highest price. We rank buyers based on price, quality requirements, quantity, distance, logistics cost, payment reliability, and verification status. Then the farmer gets the final choice.”
7. “One buyer gives ₹2,500 and another ₹2,700, but the second buyer is much farther away. Which one will you recommend?”
“We’ll calculate the estimated net return after transportation and other transaction costs. So a ₹2,700 offer isn’t automatically better if the additional logistics cost reduces the farmer’s actual profit.”
Simple formula:
Net Return = Buyer Price − Transport Cost − Storage Cost − Other Transaction Costs
8. “How will you verify that a buyer is genuine?”
“We can verify buyers using business and identity documents, contact verification, transaction history, and other relevant credentials. We’ll also maintain a buyer reliability score based on completed transactions and payment behavior.”
9. “What if a verified buyer takes the produce and doesn't pay?”
“The transaction will have a recorded agreement and payment deadline. The system will track the payment status and generate alerts for delays. If payment is still not received, the case can be escalated through our dispute and grievance mechanism.”
10. “What happens if the buyer receives the crop and says the quality isn't what was promised?”
“Quality should be agreed and recorded before the transaction. We’ll store the grade, specifications, and supporting evidence with the lot. If there is still a disagreement, both parties can submit evidence and raise a dispute for resolution.”
11. “Who will decide whether the produce is Grade A or Grade B?”
“Ideally, grading will follow standardized crop-specific quality parameters. Depending on the implementation, it can be performed by an authorized grader, FPO, collection center, or another verified quality-assessment mechanism.”
12. “What if the farmer and buyer disagree about the quantity?”
“The agreed quantity will be recorded when the lot is created. At dispatch and delivery, the quantity can be verified and the records can be compared. Any mismatch can then be documented as part of the dispute process.”
13. “Who is responsible if the produce gets damaged during transportation?”
“The responsibility will depend on the agreed transaction and logistics terms. The platform will record who is responsible for transportation and provide evidence such as dispatch and delivery records. This makes it easier to identify where the loss occurred.”
14. “How are you going to arrange transportation?”
“Once a deal is confirmed, the platform can show available transport options based on location, quantity, destination, and estimated cost. We can integrate verified logistics providers rather than trying to own the transportation ourselves.”
15. “What happens if the farmer doesn't have storage?”
“The platform will show nearby verified storage options and their estimated availability and cost. If storage isn't economically viable, the system can prioritize buyers who can take the produce immediately.”
16. “A small farmer may have only 50 or 100 kg. Will your platform still be useful?”
“Yes. Small quantities can be aggregated through an FPO or collection center. Multiple farmers producing the same crop and quality can contribute to a larger lot that meets the buyer's requirement.”
17. “How does your platform actually increase the farmer's income?”
“By giving farmers more transparent price information, multiple buyer options, better bargaining power through aggregation, and visibility of the actual net return after logistics and storage costs. We don't promise a particular income increase; we reduce the information and transaction disadvantages that can lower price realization.”
18. “You're showing a higher market price, but after transport and storage costs, is it still profitable?”
“That's exactly why we don't compare prices alone. We calculate the estimated net realization after transport and storage costs, so the farmer can compare the actual economic benefit of different selling options.”
19. “What if the farmer needs money immediately and cannot wait for a better price?”
“The farmer remains in control. The system can show both immediate selling options and potentially better future opportunities, along with the risks and estimated returns. If immediate liquidity is the priority, the farmer can choose the buyer offering quick settlement.”
20. “How will you convince farmers to trust a new platform?”
“Trust will come from transparency and verified participants. Farmers can see the price source, buyer credentials, previous transaction performance, agreed terms, and transaction history. We would also start through trusted FPOs and local agricultural networks rather than expecting individual farmers to adopt it immediately.”
21. “What if the farmer doesn't know how to use a smartphone application?”
“The interface should be very simple and available in regional languages. We can also support assisted access through FPOs, collection centers, and voice or IVR-based features, so the farmer doesn't necessarily have to operate every feature personally.”
22. “Will your platform work in local languages?”
“Yes. Local-language support is important for adoption. The core interface, notifications, and important transaction information should be available in relevant regional languages.”
23. “What happens when there is no internet connection?”
“We can design the system with low-bandwidth and assisted-access options. Important information can also be delivered through SMS or IVR where appropriate, while transactions can be synchronized when connectivity becomes available.”
🤖 AI Questions
24. “Why do you need AI here? Can't this be done with simple price comparison?”
“Basic price comparison doesn't tell the farmer what is likely to happen next or which option gives the best overall outcome. AI can analyze historical prices, arrivals, demand, seasonality and other factors to provide localized trends and sale-window recommendations. But we would keep simple rule-based logic where AI isn't necessary.”
This is a VERY good answer because you're not forcing AI everywhere.
25. “What exactly is your AI model predicting?”
“The model predicts the short-term price trend for a particular crop and market, such as whether the price is likely to increase, decrease, or remain relatively stable. That prediction supports the sale-window recommendation.”
26. “What data will you use to train your model?”
“Historical mandi prices, market arrivals, seasonal patterns, crop information, demand signals and, where reliably available, relevant weather or market factors. The exact features will depend on the crop and the availability and quality of data.”
27. “How accurate is your prediction?”
“We won't claim 100% accuracy because agricultural markets are affected by unpredictable factors. We'll evaluate the model using historical data and metrics such as MAE or RMSE, and we'll communicate uncertainty rather than presenting predictions as guaranteed prices.”
28. “What happens if there is a sudden weather event and your prediction becomes useless?”
“The model should be updated as new data arrives, and unusual conditions can reduce the confidence of the prediction. In such situations, we'll prioritize current market information and clearly indicate that the prediction has higher uncertainty.”
👥 FPO & Buyer Questions
29. “What is the role of an FPO in your system?”
“The FPO acts as an aggregation and coordination layer. It can combine produce from multiple farmers, help with quality verification and lot creation, and negotiate with buyers for larger and potentially better-value orders.”
30. “How does your platform help buyers? You're mainly talking about farmers.”
“Buyers also have a problem: finding consistent quantity and quality from reliable sources. Our platform gives them access to structured lots, verified FPOs, quality information, expected availability, and transparent transaction records.”
31. “Why would buyers come to your platform?”
“Because we reduce their sourcing effort. Instead of contacting many individual farmers, a buyer can discover aggregated lots that match their required crop, quantity and quality, and communicate with verified sellers.”
32. “What happens if the buyer needs 10 tonnes but your farmers can provide only 6 tonnes?”
“The system can identify multiple compatible farmers or FPO lots and suggest aggregation if the crop, quality and delivery conditions are compatible. If the requirement still cannot be fulfilled, the buyer can see the available quantity rather than receiving a false commitment.”
33. “How will multiple farmers contribute to one lot?”
“Farmers can submit their produce through an FPO or collection center. The system records each farmer's contribution, quality and quantity, while the FPO creates an aggregated lot for the buyer.”
34. “What information will you store for every transaction?”
“We would maintain the lot details, farmer or FPO, buyer, quantity, quality grade, agreed price, offer and acceptance, logistics information, payment status, timestamps, and relevant dispute records.”
Dispute Questions
35. “How will you handle disputes?”
“We'll maintain a digital record of the agreed terms and evidence throughout the transaction. If a dispute occurs, either party can raise a grievance, submit supporting evidence, and the case can be reviewed through the defined dispute-resolution process.”
Business Model
36. “Who is going to pay for your platform?”
“The basic information and discovery features can remain accessible to farmers, while revenue can come from transaction-based fees or value-added services for buyers, FPOs, logistics partners, or other institutional users.”
37. “What's your business model?”
“Our model can be transaction-based: we charge a small service fee when a successful trade is completed, with additional optional services such as logistics coordination, analytics, or premium sourcing tools for institutional buyers.”
38. “What stops a farmer and buyer from finding each other on your platform and then completing the deal outside your platform?”
“We need to provide enough value inside the platform that completing the transaction through us is safer and easier—verified identities, digital agreements, quality records, logistics coordination, payment tracking and dispute support. The goal is to make the platform useful throughout the transaction, not just for discovery.”
Competition
39. “There are already agricultural marketplaces and mandi-price platforms. Why is your solution different?”
“Existing platforms may provide prices or marketplace functionality, but our focus is on connecting the complete journey—from market intelligence and buyer discovery to quality, matching, logistics, payment tracking and dispute support. We want to bridge the gap between knowing the price and actually completing a reliable transaction.”
Shorter version:
“We are not just a price-information platform and not just a marketplace; we're connecting price intelligence with verified demand and transaction execution.”
Final Question
40. “If I give you funding today, how will you implement this in the real world?”
“We would start with a focused pilot rather than launching everywhere at once. First, we'd select a few crops and a specific region, onboard FPOs and verified buyers, integrate reliable market-price data, and test the farmer-to-buyer transaction workflow. Then we'd measure metrics such as price realization, transaction time, logistics cost, successful transactions and farmer adoption. Based on the results, we'd expand to more crops and regions.”